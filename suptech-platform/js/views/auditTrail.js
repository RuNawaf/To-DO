(function (global) {
  "use strict";
  var esc = UI.esc;

  function render(state) {
    var items = state.auditTrail
      .slice()
      .sort(function (a, b) { return new Date(b.time.replace(" ", "T")) - new Date(a.time.replace(" ", "T")); });

    var rows = items
      .map(function (e) {
        var expanded = !!state.auditExpanded[e.id];
        return (
          '<div class="audit-item' + (expanded ? " expanded" : "") + '">' +
          '<div class="audit-row" data-action="toggle-audit" data-id="' + e.id + '">' +
          '<div class="audit-time">' + esc(e.time) + "</div>" +
          '<div class="audit-main">' +
          '<div class="audit-agent">' + esc(e.agent) + "</div>" +
          '<div class="audit-op">' + esc(e.operation) + '<span class="caret">▸</span></div>' +
          "</div>" +
          '<div class="audit-conf">' + (e.confidence !== null && e.confidence !== undefined ? e.confidence + "% conf." : "—") + "</div>" +
          "</div>" +
          '<div class="audit-detail">' +
          "<div><b>Inputs:</b> " + esc(e.inputs) + "</div>" +
          "<div><b>Result:</b> " + esc(e.result) + "</div>" +
          "<div><b>Confidence Score:</b> " + (e.confidence !== null && e.confidence !== undefined ? e.confidence + "%" : "N/A (manual action)") + "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    return (
      "" +
      UI.eyebrow("06", "Traceability") +
      '<h1 class="page-title">Audit Trail</h1>' +
      '<p class="page-sub">Complete, chronological log of every action taken by supervisors and AI agents, so each decision can be traced and explained.</p>' +
      UI.disclaimer() +
      '<div class="panel">' +
      '<div class="panel-body">' +
      (items.length
        ? rows
        : '<div class="empty-state"><div class="em-title">No audit events yet</div>Actions taken across the platform will appear here.</div>') +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.auditTrail = render;
})(window);
