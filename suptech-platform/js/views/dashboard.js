(function (global) {
  "use strict";
  var esc = UI.esc;
  var D = APP_DATA;

  function riskCounts(banks) {
    var counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    banks.forEach(function (b) { counts[b.riskLevel] = (counts[b.riskLevel] || 0) + 1; });
    return counts;
  }

  function render(state) {
    var f = state.dashboardFilters;
    var counts = riskCounts(state.banks);

    var latestAlerts = state.alerts
      .slice()
      .sort(function (a, b) { return new Date(b.detected) - new Date(a.detected); })
      .slice(0, 6);

    var showCar = f.indicator === "all" || f.indicator === "car";
    var showLcr = f.indicator === "all" || f.indicator === "lcr";

    var carChart = Charts.lineChart({
      width: 620,
      height: 220,
      labels: D.MONTHS,
      series: [{ label: "Sector Avg CAR", color: "var(--primary)", values: D.SECTOR_CAR_SERIES }],
      thresholds: [{ value: D.CAR_THRESHOLD, color: "var(--critical)", label: "Min 10.5%" }],
    });
    var lcrChart = Charts.lineChart({
      width: 620,
      height: 220,
      labels: D.MONTHS,
      series: [{ label: "Sector Avg LCR", color: "#2f6f8f", values: D.SECTOR_LCR_SERIES }],
      thresholds: [{ value: D.LCR_THRESHOLD, color: "var(--critical)", label: "Min 100%" }],
    });

    var donut = Charts.donutChart(
      [
        { label: "Critical", value: counts.Critical, color: "var(--critical)" },
        { label: "High", value: counts.High, color: "#e07a45" },
        { label: "Medium", value: counts.Medium, color: "var(--medium)" },
        { label: "Low", value: counts.Low, color: "var(--primary)" },
      ],
      { size: 176 }
    );

    var donutLegend = ["Critical", "High", "Medium", "Low"]
      .map(function (k) {
        var color = k === "Critical" ? "var(--critical)" : k === "High" ? "#e07a45" : k === "Medium" ? "var(--medium)" : "var(--primary)";
        return '<div class="legend-item"><span class="legend-swatch" style="background:' + color + ';height:10px;border-radius:2px;"></span>' + k + " (" + counts[k] + ")</div>";
      })
      .join("");

    var alertRows = latestAlerts
      .map(function (a) {
        var bank = Store.findBank(a.bankId);
        return (
          '<tr class="clickable" data-action="goto-alert" data-id="' + a.id + '">' +
          "<td class=\"cell-strong\">" + esc(bank ? bank.name : a.bankId) + "</td>" +
          "<td>" + esc(a.indicator) + "</td>" +
          "<td>" + UI.severityBadge(a.severity) + "</td>" +
          '<td class="cell-num">' + esc(a.detected.slice(0, 10)) + "</td>" +
          "<td>" + UI.alertStatusBadge(a.status) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      "" +
      UI.eyebrow("01", "Overview") +
      '<h1 class="page-title">Banking Supervision Overview</h1>' +
      '<p class="page-sub">Consolidated view of bank submissions, capital and liquidity indicators, and active supervisory alerts across the monitored portfolio.</p>' +
      UI.disclaimer() +
      '<div class="filters-row">' +
      '<div class="field"><label for="f-period">Reporting Period</label>' +
      '<select class="select" id="f-period" data-action="set-dashboard-filter" data-key="period">' +
      ["Q3 2025", "Q2 2025", "Q1 2025", "Q4 2024"]
        .map(function (p) { return '<option ' + (f.period === p ? "selected" : "") + ">" + p + "</option>"; })
        .join("") +
      "</select></div>" +
      '<div class="field"><label for="f-indicator">Indicator Type</label>' +
      '<select class="select" id="f-indicator" data-action="set-dashboard-filter" data-key="indicator">' +
      '<option value="all" ' + (f.indicator === "all" ? "selected" : "") + ">All Indicators</option>" +
      '<option value="car" ' + (f.indicator === "car" ? "selected" : "") + ">Capital Adequacy (CAR)</option>" +
      '<option value="lcr" ' + (f.indicator === "lcr" ? "selected" : "") + ">Liquidity Coverage (LCR)</option>" +
      "</select></div>" +
      "</div>" +
      '<div class="metrics-row">' +
      '<div class="metric"><div class="metric-label">Banks Monitored</div><div class="metric-value">12</div><div class="metric-delta">Across 3 segments</div></div>' +
      '<div class="metric"><div class="metric-label">Reports Received</div><div class="metric-value">48</div><div class="metric-delta up">+6 vs. prior period</div></div>' +
      '<div class="metric"><div class="metric-label">Critical Alerts</div><div class="metric-value critical">3</div><div class="metric-delta down">Requires immediate action</div></div>' +
      '<div class="metric"><div class="metric-label">Reports Under Review</div><div class="metric-value">7</div><div class="metric-delta">Awaiting supervisor sign-off</div></div>' +
      "</div>" +
      '<div class="grid-2">' +
      '<div>' +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">CAR &amp; LCR Trend — Last 12 Months</span><span class="panel-note">Sector average, quarterly submissions</span></div>' +
      '<div class="panel-body">' +
      (showCar
        ? '<div style="margin-bottom:' + (showLcr ? "22px" : "0") + '"><div class="chart-legend"><span class="legend-item"><span class="legend-swatch" style="background:var(--primary)"></span>Capital Adequacy Ratio</span><span class="legend-item"><span class="legend-swatch" style="background:var(--critical);border-top:2px dashed var(--critical)"></span>Regulatory Minimum 10.5%</span></div>' + carChart + "</div>"
        : "") +
      (showLcr
        ? '<div><div class="chart-legend"><span class="legend-item"><span class="legend-swatch" style="background:#2f6f8f"></span>Liquidity Coverage Ratio</span><span class="legend-item"><span class="legend-swatch" style="background:var(--critical)"></span>Regulatory Minimum 100%</span></div>' + lcrChart + "</div>"
        : "") +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div>' +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Banks by Risk Level</span></div>' +
      '<div class="panel-body" style="display:flex;flex-direction:column;align-items:center;gap:14px;">' +
      donut +
      '<div class="chart-legend" style="flex-direction:column;gap:8px;">' + donutLegend + "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Latest Alerts</span><button class="btn btn-ghost btn-sm" data-action="navigate" data-route="alerts">View all alerts &rarr;</button></div>' +
      '<div class="panel-body table-wrap">' +
      (latestAlerts.length
        ? '<table class="data-table"><thead><tr><th>Bank</th><th>Indicator</th><th>Severity</th><th>Date</th><th>Status</th></tr></thead><tbody>' + alertRows + "</tbody></table>"
        : '<div class="empty-state"><div class="em-title">No alerts</div>No supervisory alerts match the current filters.</div>') +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.dashboard = render;
})(window);
