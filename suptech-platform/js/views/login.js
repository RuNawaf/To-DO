(function (global) {
  "use strict";
  var esc = UI.esc;

  function render(state) {
    var err = state._loginError;
    return (
      '<div class="login-screen">' +
      '<div class="login-card">' +
      '<div class="login-logo">SUP<span>TECH</span></div>' +
      '<div class="login-tag">Intelligent Multi-Agent System for Banking Regulatory Supervision</div>' +
      '<form class="login-form" data-form="login">' +
      '<div class="field">' +
      '<label for="login-email">Email</label>' +
      '<input class="text-input" id="login-email" name="email" type="email" placeholder="analyst@supervisor.gov" autocomplete="username" value="' + esc(state._loginEmail || "") + '"/>' +
      "</div>" +
      '<div class="field">' +
      '<label for="login-password">Password</label>' +
      '<input class="text-input" id="login-password" name="password" type="password" placeholder="••••••••" autocomplete="current-password"/>' +
      "</div>" +
      (err ? '<div class="field-error">' + esc(err) + "</div>" : "") +
      '<button class="btn btn-primary" type="submit">Sign In</button>' +
      "</form>" +
      '<div class="login-demo">' +
      '<button data-action="demo-login" type="button">Use demo supervisor account &rarr;</button>' +
      "</div>" +
      '<div class="login-foot">The data and regulatory rules shown in this prototype are simulated for proof-of-concept purposes.<br/>They do not represent real banking data or a final regulatory decision.</div>' +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.login = render;
})(window);
