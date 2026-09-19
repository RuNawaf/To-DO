/* Central app state + tiny pub/sub. No framework, no build step. */
(function (global) {
  "use strict";

  var D = global.APP_DATA;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  var state = {
    route: "login", // login | dashboard | reports | report-detail | alerts | comparison | final-reports | audit-trail | settings
    routeParam: null,
    auth: { loggedIn: false, name: "", email: "" },

    banks: clone(D.BANKS),
    reports: clone(D.REPORTS),
    alerts: clone(D.ALERTS),
    auditTrail: clone(D.AUDIT_TRAIL),

    dashboardFilters: { period: "Q3 2025", indicator: "all" },

    reportsSearch: "",
    reportsSort: { key: "submitted", dir: "desc" },

    upload: { active: false, stage: -1, fileName: null, bankId: null, done: false, runId: 0 },
    uploadFormOpen: false,

    selectedAlertId: null,
    alertTab: "All",
    alertFilters: { bank: "all", indicator: "all", period: "all" },
    alertSort: "severity",

    comparisonSelection: ["horizon", "atlas", "summit", "coastal"],

    finalReportBankId: "horizon",
    finalReportStatus: "Draft", // Draft | Submitted | Approved

    auditExpanded: {},

    toasts: [],
    toastSeq: 1,

    reportNoteDrafts: {},
    reportAssignments: {},
    reportDetailUI: { assignOpen: false, noteOpen: false },
  };

  var listeners = [];
  function subscribe(fn) {
    listeners.push(fn);
  }
  function emit() {
    listeners.forEach(function (fn) {
      fn(state);
    });
  }

  var nextToastId = 1;
  function toast(type, message) {
    var id = nextToastId++;
    state.toasts.push({ id: id, type: type, message: message });
    emit();
    setTimeout(function () {
      state.toasts = state.toasts.filter(function (t) {
        return t.id !== id;
      });
      emit();
    }, 4200);
  }

  function findBank(id) {
    return state.banks.find(function (b) {
      return b.id === id;
    });
  }
  function findAlert(id) {
    return state.alerts.find(function (a) {
      return a.id === id;
    });
  }

  function addAudit(entry) {
    var id = "AT-" + (9000 + state.auditTrail.length + 1 + Math.floor(Math.random() * 900));
    state.auditTrail.unshift(
      Object.assign(
        {
          id: id,
          time: D.simNowStr(),
          confidence: null,
        },
        entry
      )
    );
  }

  var actions = {
    login: function (email, name) {
      state.auth = { loggedIn: true, email: email, name: name || "Supervisor" };
      state.route = "dashboard";
      toast("success", "Signed in successfully.");
      emit();
    },
    logout: function () {
      state.auth = { loggedIn: false, name: "", email: "" };
      state.route = "login";
      emit();
    },
    navigate: function (route, param) {
      state.route = route;
      state.routeParam = param || null;
      state.reportDetailUI = { assignOpen: false, noteOpen: false };
      window.scrollTo(0, 0);
      emit();
    },
    toggleAssignForm: function () {
      state.reportDetailUI.assignOpen = !state.reportDetailUI.assignOpen;
      state.reportDetailUI.noteOpen = false;
      emit();
    },
    toggleNoteForm: function () {
      state.reportDetailUI.noteOpen = !state.reportDetailUI.noteOpen;
      state.reportDetailUI.assignOpen = false;
      emit();
    },

    setDashboardFilter: function (key, value) {
      state.dashboardFilters[key] = value;
      emit();
    },

    setReportsSearch: function (q) {
      state.reportsSearch = q;
      emit();
    },
    setReportsSort: function (key) {
      if (state.reportsSort.key === key) {
        state.reportsSort.dir = state.reportsSort.dir === "asc" ? "desc" : "asc";
      } else {
        state.reportsSort = { key: key, dir: "asc" };
      }
      emit();
    },

    openUploadForm: function () {
      state.uploadFormOpen = true;
      emit();
    },
    closeUploadForm: function () {
      state.uploadFormOpen = false;
      emit();
    },
    startUpload: function (fileName, bankId) {
      if (state.upload.active) return;
      if (!fileName || !fileName.trim()) {
        toast("error", "Please provide a file name before uploading.");
        return;
      }
      var okExt = /\.(xlsx?|pdf|xbrl)$/i.test(fileName.trim());
      if (!okExt) {
        toast("error", "Unsupported file type. Please use Excel, PDF, or XBRL.");
        return;
      }
      var runId = ++uploadRunSeq;
      state.uploadFormOpen = false;
      state.upload = { active: true, stage: -1, fileName: fileName.trim(), bankId: bankId, done: false, runId: runId };
      emit();
      runUploadPipeline(runId);
    },
    closeUpload: function () {
      state.upload.active = false;
      emit();
    },

    openAlert: function (id) {
      state.selectedAlertId = id;
      emit();
    },
    closeAlert: function () {
      state.selectedAlertId = null;
      emit();
    },
    setAlertTab: function (tab) {
      state.alertTab = tab;
      emit();
    },
    setAlertFilter: function (key, value) {
      state.alertFilters[key] = value;
      emit();
    },
    setAlertSort: function (key) {
      state.alertSort = key;
      emit();
    },
    setAlertStatus: function (id, status, actionLabel) {
      var a = findAlert(id);
      if (!a) return;
      a.status = status;
      a.decisionHistory.push({
        time: D.simNowStr(),
        actor: state.auth.name || "Supervisor",
        action: actionLabel,
        note: "Manual supervisor action.",
      });
      addAudit({
        agent: "Supervisor: " + (state.auth.name || "Supervisor"),
        operation: actionLabel + " — " + a.id,
        inputs: "Alert " + a.id + " (" + a.bankId + ", " + a.indicator + ")",
        result: "Status changed to “" + status + "”",
      });
      toast("success", actionLabel + ": " + a.id + " marked “" + status + "”.");
      emit();
    },

    toggleCompareBank: function (id) {
      var idx = state.comparisonSelection.indexOf(id);
      if (idx >= 0) {
        if (state.comparisonSelection.length <= 1) {
          toast("error", "Select at least one bank to compare.");
          return;
        }
        state.comparisonSelection.splice(idx, 1);
      } else {
        if (state.comparisonSelection.length >= 6) {
          toast("error", "You can compare up to 6 banks at a time.");
          return;
        }
        state.comparisonSelection.push(id);
      }
      emit();
    },

    setFinalReportBank: function (id) {
      state.finalReportBankId = id;
      state.finalReportStatus = "Draft";
      emit();
    },
    submitFinalReport: function () {
      state.finalReportStatus = "Submitted";
      addAudit({
        agent: "Supervisor: " + (state.auth.name || "Supervisor"),
        operation: "Submitted final regulatory report for review",
        inputs: "Bank: " + findBank(state.finalReportBankId).name,
        result: "Report status changed to “Submitted”",
      });
      toast("success", "Report submitted for review.");
      emit();
      setTimeout(function () {
        state.finalReportStatus = "Approved";
        addAudit({
          agent: "Compliance Director",
          operation: "Approved final regulatory report",
          inputs: "Bank: " + findBank(state.finalReportBankId).name,
          result: "Report status changed to “Approved”",
        });
        toast("info", "Report approved by Compliance Director.");
        emit();
      }, 2600);
    },
    downloadReport: function (format) {
      toast("success", format + " export generated (simulated).");
    },

    toggleAudit: function (id) {
      state.auditExpanded[id] = !state.auditExpanded[id];
      emit();
    },

    assignReviewer: function (bankId, reviewer) {
      state.reportAssignments[bankId] = reviewer;
      addAudit({
        agent: "Supervisor: " + (state.auth.name || "Supervisor"),
        operation: "Assigned bank report to reviewer",
        inputs: "Bank: " + findBank(bankId).name,
        result: "Assigned to " + reviewer,
      });
      toast("success", "Assigned to " + reviewer + ".");
      emit();
    },
    addNote: function (bankId, note) {
      if (!note || !note.trim()) {
        toast("error", "Note cannot be empty.");
        return;
      }
      if (!state.reportNoteDrafts[bankId]) state.reportNoteDrafts[bankId] = [];
      state.reportNoteDrafts[bankId].push({
        time: D.simNowStr(),
        author: state.auth.name || "Supervisor",
        text: note.trim(),
      });
      addAudit({
        agent: "Supervisor: " + (state.auth.name || "Supervisor"),
        operation: "Added note to bank report",
        inputs: "Bank: " + findBank(bankId).name,
        result: "Note recorded",
      });
      toast("success", "Note added.");
      emit();
    },

    toast: toast,
  };

  var uploadRunSeq = 0;
  function runUploadPipeline(runId) {
    var stages = 6;
    var i = 0;
    function step() {
      if (state.upload.runId !== runId) return; // superseded by a newer upload
      state.upload.stage = i;
      emit();
      if (i >= stages - 1) {
        state.upload.done = true;
        addAudit({
          agent: "Report Ingestion",
          operation: "Processed uploaded report through full pipeline",
          inputs: "File: " + state.upload.fileName,
          result: "Report standardized, rule-checked, and explanation generated",
        });
        toast("success", "Report processed successfully.");
        emit();
        return;
      }
      i++;
      setTimeout(step, 850);
    }
    setTimeout(step, 700);
  }

  global.Store = {
    state: state,
    subscribe: subscribe,
    actions: actions,
    findBank: findBank,
    findAlert: findAlert,
  };
})(window);
