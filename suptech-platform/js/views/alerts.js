(function (global) {
  "use strict";
  var esc = UI.esc;
  var D = APP_DATA;

  var TABS = ["All", "Critical", "Medium", "Low", "Closed"];

  function alertPeriod(detected) {
    var d = new Date(detected.replace(" ", "T") + ":00Z");
    var m = d.getUTCMonth() + 1;
    var q = Math.ceil(m / 3);
    return "Q" + q + " " + d.getUTCFullYear();
  }

  function matchesTab(a, tab) {
    if (tab === "All") return true;
    if (tab === "Closed") return a.status === "Closed";
    return a.severity === tab && a.status !== "Closed";
  }

  function filteredAlerts(state) {
    var f = state.alertFilters;
    var list = state.alerts.filter(function (a) {
      if (!matchesTab(a, state.alertTab)) return false;
      if (f.bank !== "all" && a.bankId !== f.bank) return false;
      if (f.indicator !== "all" && a.indicator !== f.indicator) return false;
      if (f.period !== "all" && alertPeriod(a.detected) !== f.period) return false;
      return true;
    });
    var key = state.alertSort;
    list.sort(function (a, b) {
      if (key === "severity") return D.SEVERITY_ORDER[a.severity] - D.SEVERITY_ORDER[b.severity];
      if (key === "confidence") return b.confidence - a.confidence;
      return new Date(b.detected) - new Date(a.detected);
    });
    return list;
  }

  function tabCount(state, tab) {
    return state.alerts.filter(function (a) { return matchesTab(a, tab); }).length;
  }

  function render(state) {
    var indicators = Array.from(new Set(state.alerts.map(function (a) { return a.indicator; })));
    var periods = Array.from(new Set(state.alerts.map(function (a) { return alertPeriod(a.detected); })));
    var list = filteredAlerts(state);

    var rows = list
      .map(function (a) {
        var bank = Store.findBank(a.bankId);
        return (
          '<tr class="clickable" data-action="open-alert" data-id="' + a.id + '">' +
          '<td class="cell-strong">' + esc(bank ? bank.name : a.bankId) + "</td>" +
          "<td>" + esc(a.indicator) + "</td>" +
          '<td style="max-width:280px;">' + esc(a.description) + "</td>" +
          "<td>" + UI.severityBadge(a.severity) + "</td>" +
          '<td class="cell-num">' + a.confidence + "%</td>" +
          '<td class="cell-num">' + esc(a.detected) + "</td>" +
          "<td>" + UI.alertStatusBadge(a.status) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    var tabsHtml = TABS.map(function (t) {
      return (
        '<button class="tab-btn' + (state.alertTab === t ? " active" : "") + '" data-action="set-alert-tab" data-tab="' + t + '">' +
        esc(t) + '<span class="tab-count">' + tabCount(state, t) + "</span></button>"
      );
    }).join("");

    var f = state.alertFilters;

    var panel = state.selectedAlertId ? renderSidePanel(state) : "";

    return (
      "" +
      UI.eyebrow("03", "Supervision") +
      '<h1 class="page-title">Alert Center</h1>' +
      '<p class="page-sub">AI-detected violations and anomalies awaiting supervisory review, ranked by the Alert Prioritization agent.</p>' +
      UI.disclaimer() +
      '<div class="tabs-row">' + tabsHtml + "</div>" +
      '<div class="filters-row">' +
      '<div class="field"><label for="af-bank">Bank</label><select class="select" id="af-bank" data-action="set-alert-filter" data-key="bank">' +
      '<option value="all">All Banks</option>' +
      state.banks.map(function (b) { return '<option value="' + b.id + '" ' + (f.bank === b.id ? "selected" : "") + ">" + esc(b.name) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label for="af-indicator">Indicator</label><select class="select" id="af-indicator" data-action="set-alert-filter" data-key="indicator">' +
      '<option value="all">All Indicators</option>' +
      indicators.map(function (i) { return '<option value="' + esc(i) + '" ' + (f.indicator === i ? "selected" : "") + ">" + esc(i) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label for="af-period">Reporting Period</label><select class="select" id="af-period" data-action="set-alert-filter" data-key="period">' +
      '<option value="all">All Periods</option>' +
      periods.map(function (p) { return '<option value="' + esc(p) + '" ' + (f.period === p ? "selected" : "") + ">" + esc(p) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label for="af-sort">Sort By</label><select class="select" id="af-sort" data-action="set-alert-sort">' +
      '<option value="severity" ' + (state.alertSort === "severity" ? "selected" : "") + ">Severity</option>" +
      '<option value="confidence" ' + (state.alertSort === "confidence" ? "selected" : "") + ">Confidence Score</option>" +
      '<option value="time" ' + (state.alertSort === "time" ? "selected" : "") + ">Detection Time</option>" +
      "</select></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-body table-wrap">' +
      (list.length
        ? '<table class="data-table"><thead><tr><th>Bank</th><th>Indicator</th><th>Description</th><th>Severity</th><th>Confidence</th><th>Detected</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table>"
        : '<div class="empty-state"><div class="em-title">No alerts match these filters</div>Try a different tab, bank, or indicator.</div>') +
      "</div>" +
      "</div>" +
      panel
    );
  }

  function renderSidePanel(state) {
    var a = Store.findAlert(state.selectedAlertId);
    if (!a) return "";
    var bank = Store.findBank(a.bankId);
    var agent = D.AGENTS.find(function (g) { return g.id === a.agentId; });

    var evidence = a.evidence.map(function (e) { return "<li>" + esc(e) + "</li>"; }).join("");
    var actions = a.recommendedActions
      .map(function (act) {
        var statusMap = {
          "Confirm Violation": "Confirmed",
          "Request More Information": a.status,
          "Send for Review": "Under Review",
          "Close Alert": "Closed",
        };
        var isInfo = act === "Request More Information";
        return (
          '<button class="btn ' + (act === "Confirm Violation" ? "btn-danger" : act === "Close Alert" ? "btn-secondary" : "btn-primary") + ' btn-sm" data-action="alert-action" data-id="' + a.id + '" data-status="' + statusMap[act] + '" data-label="' + esc(act) + '"' + (isInfo ? ' data-noop="1"' : "") + ">" + esc(act) + "</button>"
        );
      })
      .join("");

    var history = a.decisionHistory
      .slice()
      .reverse()
      .map(function (h) {
        return (
          '<div class="kv-row" style="display:block;">' +
          '<div style="display:flex;justify-content:space-between;"><b style="font-size:12px;">' + esc(h.actor) + "</b><span class=\"panel-note\">" + esc(h.time) + "</span></div>" +
          '<div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">' + esc(h.action) + " — " + esc(h.note) + "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      '<div class="side-panel-overlay" data-action="close-alert"></div>' +
      '<div class="side-panel" data-stop="1">' +
      '<div class="modal-head">' +
      '<div><div class="eyebrow"><span class="num">' + esc(a.id) + '</span><span class="label">Alert Detail</span></div>' +
      '<div style="font-size:17px;font-weight:700;">' + esc(bank ? bank.name : a.bankId) + "</div>" +
      '<div style="font-size:12.5px;color:var(--text-secondary);margin-top:2px;">' + esc(a.indicator) + "</div></div>" +
      '<button class="modal-close" data-action="close-alert">&times;</button>' +
      "</div>" +
      '<div style="display:flex;gap:8px;margin-bottom:18px;">' + UI.severityBadge(a.severity) + UI.alertStatusBadge(a.status) + '<span class="panel-note" style="align-self:center;">Confidence: ' + a.confidence + "%</span></div>" +
      '<div class="panel"><div class="panel-head"><span class="panel-title">Explanation</span>' + (agent ? UI.agentTag(agent.name) : "") + '</div><div class="panel-body"><div class="explain-box">' + esc(a.description) + " " + esc(agent ? agent.role : "") + "</div></div></div>" +
      '<div class="panel"><div class="panel-head"><span class="panel-title">Supporting Evidence</span></div><div class="panel-body"><ul style="margin:0;padding-left:18px;font-size:12.5px;color:var(--text-secondary);line-height:1.8;">' + evidence + "</ul></div></div>" +
      '<div class="panel"><div class="panel-head"><span class="panel-title">Regulatory Rule</span></div><div class="panel-body"><div class="ref-box">' + esc(a.regulatoryRule) + "</div></div></div>" +
      '<div class="panel"><div class="panel-head"><span class="panel-title">Recommended Actions</span></div><div class="panel-body"><div class="actions-row">' + actions + "</div></div></div>" +
      '<div class="panel"><div class="panel-head"><span class="panel-title">Decision History</span></div><div class="panel-body">' + (history || '<div class="panel-note">No prior actions recorded.</div>') + "</div></div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.alerts = render;
})(window);
