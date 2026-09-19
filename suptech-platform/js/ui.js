/* Shared UI chrome: sidebar, topbar, toasts, badges, formatting helpers. */
(function (global) {
  "use strict";

  var NAV = [
    { route: "dashboard", num: "01", label: "Dashboard" },
    { route: "reports", num: "02", label: "Bank Reports" },
    { route: "alerts", num: "03", label: "Alerts" },
    { route: "comparison", num: "04", label: "Bank Comparison" },
    { route: "final-reports", num: "05", label: "Final Reports" },
    { route: "audit-trail", num: "06", label: "Audit Trail" },
    { route: "settings", num: "07", label: "Settings" },
  ];

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function sidebar(state) {
    var items = NAV.map(function (n) {
      var active = state.route === n.route || (n.route === "reports" && state.route === "report-detail");
      return (
        '<button class="nav-item' + (active ? " active" : "") + '" data-action="navigate" data-route="' + n.route + '">' +
        '<span class="nav-num">' + n.num + "</span><span class=\"nav-label\">" + n.label + "</span>" +
        "</button>"
      );
    }).join("");

    return (
      '<aside class="sidebar">' +
      '<div class="sidebar-brand">' +
      '<div class="brand-mark">SUP<span>TECH</span></div>' +
      '<div class="brand-sub">Regulatory Supervision Platform</div>' +
      "</div>" +
      '<nav class="sidebar-nav">' + items + "</nav>" +
      '<div class="sidebar-foot">' +
      '<div class="sidebar-user">' + esc(state.auth.name || "Supervisor") + "</div>" +
      '<div>' + esc(state.auth.email || "") + "</div>" +
      '<button class="logout-link" data-action="logout">Sign out</button>' +
      "</div>" +
      "</aside>"
    );
  }

  function topbar(title) {
    return (
      '<div class="topbar">' +
      '<div class="topbar-title">' + esc(title) + "</div>" +
      '<div class="topbar-right"><span>Reporting Period: Q3 2025</span><span>&middot;</span><span>Simulated Data</span></div>' +
      "</div>"
    );
  }

  function eyebrow(num, label) {
    return '<div class="eyebrow"><span class="num">' + esc(num) + "</span><span class=\"label\">" + esc(label) + "</span></div>";
  }

  function disclaimer() {
    return (
      '<div class="disclaimer"><b>Proof-of-concept notice —</b> The data and regulatory rules shown in this prototype are simulated for proof-of-concept purposes. They do not represent real banking data or a final regulatory decision.</div>'
    );
  }

  function toastStack(state) {
    if (!state.toasts.length) return "";
    var items = state.toasts
      .map(function (t) {
        return '<div class="toast ' + t.type + '">' + esc(t.message) + "</div>";
      })
      .join("");
    return '<div class="toast-stack">' + items + "</div>";
  }

  function statusBadge(status) {
    var map = {
      Compliant: "badge-compliant",
      Violation: "badge-violation",
      "Review Required": "badge-review",
    };
    var cls = map[status] || "badge-low";
    return '<span class="badge ' + cls + '"><span class="dot"></span>' + esc(status) + "</span>";
  }

  function severityBadge(sev) {
    var map = { Critical: "badge-critical", Medium: "badge-medium", Low: "badge-low", Closed: "badge-closed" };
    return '<span class="badge ' + (map[sev] || "badge-low") + '"><span class="dot"></span>' + esc(sev) + "</span>";
  }

  function alertStatusBadge(status) {
    var map = {
      Open: "badge-violation",
      "Under Review": "badge-review",
      Confirmed: "badge-violation",
      Closed: "badge-closed",
    };
    return '<span class="badge ' + (map[status] || "badge-low") + '"><span class="dot"></span>' + esc(status) + "</span>";
  }

  function riskPill(level) {
    return '<span class="risk-pill risk-' + level.toLowerCase() + '">' + esc(level) + "</span>";
  }

  function agentTag(name) {
    return '<span class="agent-tag">' + esc(name) + "</span>";
  }

  function fmtPct(v) {
    return v.toFixed(1) + "%";
  }

  global.UI = {
    NAV: NAV,
    esc: esc,
    sidebar: sidebar,
    topbar: topbar,
    eyebrow: eyebrow,
    disclaimer: disclaimer,
    toastStack: toastStack,
    statusBadge: statusBadge,
    severityBadge: severityBadge,
    alertStatusBadge: alertStatusBadge,
    riskPill: riskPill,
    agentTag: agentTag,
    fmtPct: fmtPct,
  };
})(window);
