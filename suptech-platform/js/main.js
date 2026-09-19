(function () {
  "use strict";
  var S = Store;
  var A = S.actions;
  var app = document.getElementById("app");

  var PAGE_TITLES = {
    dashboard: "Dashboard",
    reports: "Bank Reports",
    "report-detail": "Bank Report Detail",
    alerts: "Alert Center",
    comparison: "Bank Comparison",
    "final-reports": "Final Reports",
    "audit-trail": "Audit Trail",
    settings: "Settings",
  };

  var OVERLAY_CLOSE_TARGETS = {
    upload: function () { A.closeUpload(); },
    "upload-form": function () { A.closeUploadForm(); },
  };

  function render() {
    var state = S.state;
    if (!state.auth.loggedIn) {
      app.innerHTML = Views.login(state) + UI.toastStack(state);
      return;
    }

    var viewFn = Views[toCamel(state.route)] || Views.dashboard;
    var content = viewFn(state);

    app.innerHTML =
      '<div class="shell">' +
      UI.sidebar(state) +
      '<div class="main">' +
      UI.topbar(PAGE_TITLES[state.route] || "SupTech") +
      '<div class="content">' + content + "</div>" +
      "</div>" +
      "</div>" +
      Views.uploadForm(state) +
      Views.uploadModal(state) +
      UI.toastStack(state);
  }

  function toCamel(route) {
    return route.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
  }

  S.subscribe(render);

  // ---------------- event delegation ----------------

  document.addEventListener("click", function (e) {
    var actionEl = e.target.closest("[data-action]");
    if (!actionEl) return;
    var action = actionEl.dataset.action;

    // Clicks that bubble up from inside modal content (data-stop) should
    // never fall through to the backdrop's overlay-close handler.
    if (action === "overlay-close" && e.target.closest("[data-stop]")) return;

    switch (action) {
      case "overlay-close":
        var closeFn = OVERLAY_CLOSE_TARGETS[actionEl.dataset.target];
        if (closeFn) closeFn();
        break;
      case "navigate":
        A.closeUpload();
        A.navigate(actionEl.dataset.route, actionEl.dataset.id);
        break;
      case "logout":
        A.logout();
        break;
      case "demo-login":
        A.login("supervisor.demo@centralbank.gov", "A. Reyes");
        break;
      case "goto-alert":
        A.navigate("alerts");
        A.openAlert(actionEl.dataset.id);
        break;
      case "open-upload":
        A.openUploadForm();
        break;
      case "close-upload-form":
        A.closeUploadForm();
        break;
      case "close-upload":
        A.closeUpload();
        break;
      case "sort-reports":
        A.setReportsSort(actionEl.dataset.key);
        break;
      case "open-alert":
        A.openAlert(actionEl.dataset.id);
        break;
      case "close-alert":
        A.closeAlert();
        break;
      case "set-alert-tab":
        A.setAlertTab(actionEl.dataset.tab);
        break;
      case "alert-action":
        handleAlertAction(actionEl);
        break;
      case "toggle-compare-bank":
        A.toggleCompareBank(actionEl.dataset.id);
        break;
      case "download-report":
        A.downloadReport(actionEl.dataset.format);
        break;
      case "submit-final-report":
        if (!actionEl.disabled) A.submitFinalReport();
        break;
      case "toggle-audit":
        A.toggleAudit(actionEl.dataset.id);
        break;
      case "toggle-assign":
        A.toggleAssignForm();
        break;
      case "toggle-note":
        A.toggleNoteForm();
        break;
      case "generate-report":
        A.setFinalReportBank(actionEl.dataset.id);
        A.navigate("final-reports");
        break;
      default:
        break;
    }
  });

  function handleAlertAction(el) {
    var id = el.dataset.id;
    var label = el.dataset.label;
    var alert = S.findAlert(id);
    var bank = alert ? S.findBank(alert.bankId) : null;
    if (el.dataset.noop) {
      A.toast("info", "Request for more information sent to " + (bank ? bank.name : "the bank") + ".");
      return;
    }
    A.setAlertStatus(id, el.dataset.status, label);
  }

  document.addEventListener("change", function (e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.dataset.action;
    switch (action) {
      case "set-dashboard-filter":
        A.setDashboardFilter(el.dataset.key, el.value);
        break;
      case "set-alert-filter":
        A.setAlertFilter(el.dataset.key, el.value);
        break;
      case "set-alert-sort":
        A.setAlertSort(el.value);
        break;
      case "set-final-bank":
        A.setFinalReportBank(el.value);
        break;
      default:
        break;
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target.id === "reports-search") {
      A.setReportsSearch(e.target.value);
    }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-form]");
    if (!form) return;
    e.preventDefault();
    var kind = form.dataset.form;
    var fd = new FormData(form);

    if (kind === "login") {
      var email = (fd.get("email") || "").trim();
      var password = (fd.get("password") || "").trim();
      if (!email || !password) {
        S.state._loginError = "Please enter both email and password.";
        S.state._loginEmail = email;
        render();
        return;
      }
      S.state._loginError = null;
      var name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
      A.login(email, name || "Supervisor");
    }

    if (kind === "upload") {
      var bankId = fd.get("bankId");
      var fileName = fd.get("fileName");
      A.startUpload(fileName, bankId);
    }

    if (kind === "assign") {
      A.assignReviewer(S.state.routeParam, fd.get("reviewer"));
    }

    if (kind === "note") {
      A.addNote(S.state.routeParam, fd.get("note"));
    }
  });

  // initial paint
  render();
})();
