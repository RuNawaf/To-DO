(function (global) {
  "use strict";
  var esc = UI.esc;

  var PIPELINE_STAGES = [
    { title: "File Intake", sub: "Receiving and validating the submitted file", agent: "Report Ingestion" },
    { title: "Data Standardization", sub: "Mapping fields into the internal regulatory schema", agent: "Report Ingestion" },
    { title: "Rule Matching", sub: "Checking figures against Basel III / local thresholds", agent: "Rule Matching" },
    { title: "Anomaly Detection", sub: "Comparing against historical trend and peer behavior", agent: "Anomaly Detection" },
    { title: "Explanation Generation", sub: "Drafting a plain-language explanation with regulatory citations", agent: "Explanation Agent (LLM + RAG)" },
    { title: "Final Report", sub: "Compiling the processed result for supervisor review", agent: "Alert Prioritization" },
  ];

  function sortIcon(state, key) {
    if (state.reportsSort.key !== key) return "";
    return '<span class="arrow">' + (state.reportsSort.dir === "asc" ? "↑" : "↓") + "</span>";
  }

  function filteredReports(state) {
    var q = state.reportsSearch.trim().toLowerCase();
    var rows = state.reports
      .map(function (r) {
        var bank = Store.findBank(r.bankId);
        return { r: r, bank: bank };
      })
      .filter(function (row) {
        if (!q) return true;
        return (
          row.bank.name.toLowerCase().indexOf(q) !== -1 ||
          row.r.period.toLowerCase().indexOf(q) !== -1 ||
          row.r.fileType.toLowerCase().indexOf(q) !== -1
        );
      });

    var key = state.reportsSort.key;
    var dir = state.reportsSort.dir === "asc" ? 1 : -1;
    rows.sort(function (a, b) {
      var av, bv;
      switch (key) {
        case "bank": av = a.bank.name; bv = b.bank.name; break;
        case "period": av = a.r.period; bv = b.r.period; break;
        case "fileType": av = a.r.fileType; bv = b.r.fileType; break;
        case "car": av = a.r.car; bv = b.r.car; break;
        case "lcr": av = a.r.lcr; bv = b.r.lcr; break;
        case "status": av = a.r.status; bv = b.r.status; break;
        default: av = a.r.submitted; bv = b.r.submitted;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return rows;
  }

  function render(state) {
    var rows = filteredReports(state);

    var body = rows.length
      ? rows
          .map(function (row) {
            var r = row.r, bank = row.bank;
            return (
              '<tr class="clickable" data-action="navigate" data-route="report-detail" data-id="' + row.bank.id + '">' +
              '<td class="cell-strong">' + esc(bank.name) + "</td>" +
              "<td>" + esc(r.period) + "</td>" +
              "<td>" + esc(r.fileType) + "</td>" +
              '<td class="cell-num' + (r.car < 10.5 ? " cell-critical" : "") + '">' + r.car.toFixed(1) + "%</td>" +
              '<td class="cell-num' + (r.lcr < 100 ? " cell-critical" : "") + '">' + r.lcr + "%</td>" +
              "<td>" + UI.statusBadge(r.status) + "</td>" +
              '<td class="cell-num">' + esc(r.submitted) + "</td>" +
              "</tr>"
            );
          })
          .join("")
      : "";

    return (
      "" +
      UI.eyebrow("02", "Submissions") +
      '<h1 class="page-title">Bank Reports</h1>' +
      '<p class="page-sub">Prudential submissions received from monitored banks, standardized and checked against regulatory thresholds.</p>' +
      UI.disclaimer() +
      '<div class="filters-row" style="justify-content:space-between;">' +
      '<div class="field"><label for="reports-search">Search</label>' +
      '<input class="text-input search-input" id="reports-search" data-action="reports-search" type="text" placeholder="Search by bank, period, or file type" value="' + esc(state.reportsSearch) + '"/>' +
      "</div>" +
      '<button class="btn btn-primary" data-action="open-upload">+ Upload New Report</button>' +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-body table-wrap">' +
      (rows.length
        ? '<table class="data-table"><thead><tr>' +
          '<th class="sortable" data-action="sort-reports" data-key="bank">Bank Name' + sortIcon(state, "bank") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="period">Reporting Period' + sortIcon(state, "period") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="fileType">File Type' + sortIcon(state, "fileType") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="car">CAR' + sortIcon(state, "car") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="lcr">LCR' + sortIcon(state, "lcr") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="status">Processing Status' + sortIcon(state, "status") + "</th>" +
          '<th class="sortable" data-action="sort-reports" data-key="submitted">Submission Date' + sortIcon(state, "submitted") + "</th>" +
          "</tr></thead><tbody>" + body + "</tbody></table>"
        : '<div class="empty-state"><div class="em-title">No reports match your search</div>Try a different bank name, period, or file type.</div>') +
      "</div>" +
      "</div>"
    );
  }

  function stepMarker(idx, stage) {
    if (stage > idx) return '<div class="step-marker done">✓</div>';
    if (stage === idx) return '<div class="step-marker active">' + (idx + 1) + "</div>";
    return '<div class="step-marker">' + (idx + 1) + "</div>";
  }

  function uploadModal(state) {
    var u = state.upload;
    if (!u.active) return "";
    var bank = Store.findBank(u.bankId) || { name: "Selected Bank" };

    var body;
    if (!u.done && u.stage === -1) {
      body = '<div class="loading-row"><div class="spinner"></div>Preparing upload…</div>';
    } else {
      var steps = PIPELINE_STAGES.map(function (s, idx) {
        var isActive = idx === u.stage && !u.done;
        var isDone = idx < u.stage || u.done;
        var pct = isDone ? 100 : isActive ? 55 : 0;
        return (
          '<div class="pipeline-step">' +
          stepMarker(idx, u.done ? 999 : u.stage) +
          '<div class="step-body">' +
          '<div class="step-title' + (idx > u.stage && !u.done ? " pending" : "") + '">' + esc(s.title) + "</div>" +
          '<div class="step-sub">' + esc(s.sub) + " — " + UI.agentTag(s.agent) + "</div>" +
          (isActive ? '<div class="step-bar"><div class="step-bar-fill" style="width:' + pct + '%"></div></div>' : "") +
          "</div>" +
          "</div>"
        );
      }).join("");

      body =
        '<div class="pipeline">' + steps + "</div>" +
        (u.done
          ? '<div class="explain-box">Report processed successfully. All 6 pipeline stages completed for <b>' + esc(bank.name) + "</b>. <a href=\"#\" data-action=\"navigate\" data-route=\"report-detail\" data-id=\"" + esc(u.bankId) + '" style="color:var(--primary-dark);font-weight:700;">View processed result &rarr;</a></div>'
          : "");
    }

    return (
      '<div class="overlay" data-action="overlay-close" data-target="upload">' +
      '<div class="modal" data-stop="1">' +
      '<div class="modal-head"><div><div class="eyebrow"><span class="num">02.1</span><span class="label">Upload Pipeline</span></div><div style="font-size:16px;font-weight:700;">Processing ' + esc(u.fileName || "report") + "</div></div>" +
      '<button class="modal-close" data-action="close-upload">&times;</button>' +
      "</div>" +
      body +
      '<div class="actions-row">' +
      (u.done
        ? '<button class="btn btn-secondary" data-action="close-upload">Close</button>'
        : '<button class="btn btn-ghost" data-action="close-upload">Run in background</button>') +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function uploadForm(state) {
    if (!state.uploadFormOpen) return "";
    return (
      '<div class="overlay" data-action="overlay-close" data-target="upload-form">' +
      '<div class="modal" data-stop="1">' +
      '<div class="modal-head"><div><div class="eyebrow"><span class="num">02.1</span><span class="label">New Submission</span></div><div style="font-size:16px;font-weight:700;">Upload New Report</div></div>' +
      '<button class="modal-close" data-action="close-upload-form">&times;</button>' +
      "</div>" +
      '<form data-form="upload">' +
      '<div class="field" style="margin-bottom:14px;">' +
      '<label for="upload-bank">Bank</label>' +
      '<select class="select" id="upload-bank" name="bankId" style="width:100%;min-width:0;">' +
      state.banks.map(function (b) { return '<option value="' + b.id + '">' + esc(b.name) + "</option>"; }).join("") +
      "</select>" +
      "</div>" +
      '<div class="field" style="margin-bottom:14px;">' +
      '<label for="upload-period">Reporting Period</label>' +
      '<select class="select" id="upload-period" name="period" style="width:100%;min-width:0;">' +
      '<option>Q3 2025</option><option>Q2 2025</option><option>Q1 2025</option>' +
      "</select>" +
      "</div>" +
      '<div class="field" style="margin-bottom:6px;">' +
      '<label for="upload-file">File (Excel, PDF, or XBRL)</label>' +
      '<input class="text-input" id="upload-file" name="fileName" type="text" placeholder="e.g. horizon_q3_2025.xbrl" style="width:100%;"/>' +
      "</div>" +
      '<div class="panel-note" style="margin-bottom:18px;">Accepted formats: .xlsx, .pdf, .xbrl. This is a simulated upload — no file is transmitted.</div>' +
      '<div class="actions-row">' +
      '<button type="submit" class="btn btn-primary">Upload &amp; Process</button>' +
      '<button type="button" class="btn btn-ghost" data-action="close-upload-form">Cancel</button>' +
      "</div>" +
      "</form>" +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.reports = render;
  global.Views.uploadModal = uploadModal;
  global.Views.uploadForm = uploadForm;
  global.Views.PIPELINE_STAGES = PIPELINE_STAGES;
})(window);
