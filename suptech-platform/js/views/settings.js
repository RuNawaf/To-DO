(function (global) {
  "use strict";
  var esc = UI.esc;
  var D = APP_DATA;

  function render(state) {
    var agentRows = D.AGENTS.map(function (a) {
      return (
        '<div class="kv-row" style="display:block;padding:14px 0;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span style="font-weight:700;font-size:13px;">' + esc(a.name) + "</span>" +
        '<span class="badge badge-compliant"><span class="dot"></span>Active</span>' +
        "</div>" +
        '<div style="font-size:12.5px;color:var(--text-secondary);margin-top:4px;">' + esc(a.role) + "</div>" +
        "</div>"
      );
    }).join("");

    return (
      "" +
      UI.eyebrow("07", "Configuration") +
      '<h1 class="page-title">Settings</h1>' +
      '<p class="page-sub">Account preferences and the multi-agent system configuration behind this platform.</p>' +
      UI.disclaimer() +
      '<div class="grid-2">' +
      '<div>' +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Account</span></div>' +
      '<div class="panel-body">' +
      '<div class="kv-list">' +
      '<div class="kv-row"><span class="k">Name</span><span class="v">' + esc(state.auth.name || "Supervisor") + "</span></div>" +
      '<div class="kv-row"><span class="k">Email</span><span class="v">' + esc(state.auth.email || "") + "</span></div>" +
      '<div class="kv-row"><span class="k">Role</span><span class="v">Regulatory Analyst</span></div>' +
      '<div class="kv-row"><span class="k">Institution</span><span class="v">Central Bank &mdash; Prudential Supervision Dept.</span></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Notification Preferences</span></div>' +
      '<div class="panel-body">' +
      '<div class="kv-list">' +
      '<div class="kv-row"><span class="k">Critical alerts</span><span class="v">Email + In-app</span></div>' +
      '<div class="kv-row"><span class="k">Medium alerts</span><span class="v">In-app only</span></div>' +
      '<div class="kv-row"><span class="k">Report submissions</span><span class="v">Daily digest</span></div>' +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div>' +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Multi-Agent System</span><span class="panel-note">6 active agents</span></div>' +
      '<div class="panel-body">' + agentRows + "</div>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.settings = render;
})(window);
