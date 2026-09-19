(function (global) {
  "use strict";
  var esc = UI.esc;
  var D = APP_DATA;

  function hashNum(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function financials(bank) {
    if (bank.id === "horizon") {
      return { capital: 612.4, rwa: 6514.9, hqla: 528.3, outflows: 447.7 };
    }
    var seed = hashNum(bank.id);
    var rwa = 2000 + (seed % 5000);
    var capital = (rwa * bank.car) / 100;
    var outflows = 300 + (seed % 400);
    var hqla = (outflows * bank.lcr) / 100;
    return {
      capital: Math.round(capital * 10) / 10,
      rwa: Math.round(rwa * 10) / 10,
      hqla: Math.round(hqla * 10) / 10,
      outflows: Math.round(outflows * 10) / 10,
    };
  }

  function explanationText(bank) {
    var carViol = bank.car < D.CAR_THRESHOLD;
    var lcrViol = bank.lcr < D.LCR_THRESHOLD;
    if (!carViol && !lcrViol) {
      return (
        "Both the Capital Adequacy Ratio (" + bank.car.toFixed(1) + "%) and Liquidity Coverage Ratio (" + bank.lcr +
        "%) for " + bank.name + " remain above their respective regulatory minimums. No violation was detected for the current reporting period, and the bank's trend over the last 12 months shows no early-warning deterioration pattern."
      );
    }
    var parts = [];
    if (carViol) {
      parts.push(
        bank.name + "'s Capital Adequacy Ratio fell to " + bank.car.toFixed(1) + "%, which is " +
        (D.CAR_THRESHOLD - bank.car).toFixed(1) + " percentage points below the Basel III regulatory minimum of " + D.CAR_THRESHOLD +
        "%. This means the bank's available capital is no longer sufficient, relative to its risk-weighted assets, to absorb unexpected losses at the level regulators require. The Rule Matching agent flagged this automatically upon ingestion of the Q3 2025 submission, and the Anomaly Detection agent confirmed the decline is part of a sustained multi-quarter downward trend rather than a one-off reporting anomaly."
      );
    }
    if (lcrViol) {
      parts.push(
        bank.name + "'s Liquidity Coverage Ratio stands at " + bank.lcr + "%, below the " + D.LCR_THRESHOLD +
        "% minimum, indicating that the bank's stock of high-quality liquid assets would not fully cover projected net cash outflows under a 30-day stress scenario."
      );
    }
    return parts.join(" ");
  }

  function render(state) {
    var bankId = state.routeParam || "horizon";
    var bank = Store.findBank(bankId);
    if (!bank) bank = state.banks[0];

    var carViolation = bank.car < D.CAR_THRESHOLD;
    var lcrViolation = bank.lcr < D.LCR_THRESHOLD;
    var fin = financials(bank);
    var ui = state.reportDetailUI;

    var trendChart = Charts.lineChart({
      width: 900,
      height: 240,
      labels: D.MONTHS,
      series: [
        { label: "CAR", color: "var(--primary)", values: bank.carSeries },
      ],
      thresholds: [{ value: D.CAR_THRESHOLD, color: "var(--critical)", label: "CAR Min " + D.CAR_THRESHOLD + "%" }],
    });
    var trendChartLcr = Charts.lineChart({
      width: 900,
      height: 240,
      labels: D.MONTHS,
      series: [{ label: "LCR", color: "#2f6f8f", values: bank.lcrSeries }],
      thresholds: [{ value: D.LCR_THRESHOLD, color: "var(--critical)", label: "LCR Min " + D.LCR_THRESHOLD + "%" }],
    });

    var notes = state.reportNoteDrafts[bank.id] || [];
    var assignedTo = state.reportAssignments[bank.id];

    return (
      "" +
      '<div style="margin-bottom:6px;"><button class="btn btn-ghost btn-sm" data-action="navigate" data-route="reports" style="padding-left:0;">&larr; Back to Bank Reports</button></div>' +
      UI.eyebrow("02.2", "Report Detail") +
      '<h1 class="page-title">' + esc(bank.name) + "</h1>" +
      '<p class="page-sub">' + esc(bank.segment) + " segment &middot; Reporting period Q3 2025 &middot; " + UI.statusBadge(bank.status) + "</p>" +
      UI.disclaimer() +
      '<div class="metrics-row">' +
      '<div class="metric"><div class="metric-label">Current CAR</div><div class="metric-value' + (carViolation ? " critical" : "") + '">' + bank.car.toFixed(1) + "%</div><div class=\"metric-delta" + (carViolation ? " down" : "") + '">Threshold: ' + D.CAR_THRESHOLD + "%" + (carViolation ? " — VIOLATION" : " — Compliant") + "</div></div>" +
      '<div class="metric"><div class="metric-label">Current LCR</div><div class="metric-value' + (lcrViolation ? " critical" : "") + '">' + bank.lcr + "%</div><div class=\"metric-delta" + (lcrViolation ? " down" : "") + '">Threshold: ' + D.LCR_THRESHOLD + "%" + (lcrViolation ? " — VIOLATION" : " — Compliant") + "</div></div>" +
      '<div class="metric"><div class="metric-label">NPL Ratio</div><div class="metric-value">' + bank.npl + "%</div><div class=\"metric-delta\">Non-performing loans</div></div>" +
      '<div class="metric"><div class="metric-label">Leverage Ratio</div><div class="metric-value">' + bank.leverage + "%</div><div class=\"metric-delta\">Regulatory floor: 3.0%</div></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Historical Trend — 12 Months</span></div>' +
      '<div class="panel-body">' +
      '<div class="chart-legend"><span class="legend-item"><span class="legend-swatch" style="background:var(--primary)"></span>Capital Adequacy Ratio</span></div>' +
      trendChart +
      '<div class="chart-legend" style="margin-top:20px;"><span class="legend-item"><span class="legend-swatch" style="background:#2f6f8f"></span>Liquidity Coverage Ratio</span></div>' +
      trendChartLcr +
      "</div>" +
      "</div>" +
      '<div class="grid-2">' +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Capital Adequacy Ratio — Calculation</span></div>' +
      '<div class="panel-body">' +
      '<div class="kv-list">' +
      '<div class="kv-row"><span class="k">Tier 1 + Tier 2 Capital</span><span class="v">$' + fin.capital.toLocaleString() + "M</span></div>" +
      '<div class="kv-row"><span class="k">Risk-Weighted Assets</span><span class="v">$' + fin.rwa.toLocaleString() + "M</span></div>" +
      "</div>" +
      '<div class="formula-box">CAR = Total Capital &divide; Risk-Weighted Assets<br/>CAR = ' + fin.capital + " / " + fin.rwa + ' = <b style="color:' + (carViolation ? "var(--critical)" : "var(--primary)") + '">' + bank.car.toFixed(1) + "%</b></div>" +
      (carViolation
        ? '<div class="field-error" style="font-size:12px;">Result is below the ' + D.CAR_THRESHOLD + "% regulatory minimum.</div>"
        : '<div class="metric-delta up" style="font-size:12px;">Result meets the ' + D.CAR_THRESHOLD + "% regulatory minimum.</div>") +
      "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Liquidity Coverage Ratio — Calculation</span></div>' +
      '<div class="panel-body">' +
      '<div class="kv-list">' +
      '<div class="kv-row"><span class="k">High-Quality Liquid Assets</span><span class="v">$' + fin.hqla.toLocaleString() + "M</span></div>" +
      '<div class="kv-row"><span class="k">Net Cash Outflows (30-day stress)</span><span class="v">$' + fin.outflows.toLocaleString() + "M</span></div>" +
      "</div>" +
      '<div class="formula-box">LCR = HQLA &divide; Net Cash Outflows<br/>LCR = ' + fin.hqla + " / " + fin.outflows + ' = <b style="color:' + (lcrViolation ? "var(--critical)" : "var(--primary)") + '">' + bank.lcr + "%</b></div>" +
      (lcrViolation
        ? '<div class="field-error" style="font-size:12px;">Result is below the ' + D.LCR_THRESHOLD + "% regulatory minimum.</div>"
        : '<div class="metric-delta up" style="font-size:12px;">Result meets the ' + D.LCR_THRESHOLD + "% regulatory minimum.</div>") +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">AI Agent Explanation</span>' + UI.agentTag("Explanation Agent (LLM + RAG)") + "</div>" +
      '<div class="panel-body"><div class="explain-box">' + esc(explanationText(bank)) + "</div></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Regulatory Reference</span></div>' +
      '<div class="panel-body"><div class="ref-box">' + esc(D.REGULATORY_REFERENCE.excerpt) + '<div class="ref-source">' + esc(D.REGULATORY_REFERENCE.source) + "</div></div></div>" +
      "</div>" +
      '<div class="panel">' +
      '<div class="panel-head"><span class="panel-title">Supervisor Actions</span></div>' +
      '<div class="panel-body">' +
      '<div class="actions-row">' +
      '<button class="btn btn-secondary" data-action="toggle-assign">Assign to Reviewer</button>' +
      '<button class="btn btn-secondary" data-action="toggle-note">Add Note</button>' +
      '<button class="btn btn-primary" data-action="generate-report" data-id="' + esc(bank.id) + '">Generate Report</button>' +
      "</div>" +
      (assignedTo ? '<div class="metric-delta up" style="margin-top:12px;">Currently assigned to <b>' + esc(assignedTo) + "</b></div>" : "") +
      (ui.assignOpen
        ? '<form data-form="assign" style="margin-top:16px;display:flex;gap:10px;align-items:flex-end;">' +
          '<div class="field"><label for="assign-reviewer">Reviewer</label><select class="select" id="assign-reviewer" name="reviewer">' +
          ["A. Reyes", "M. Chen", "S. Okoro", "L. Fernandez"].map(function (n) { return "<option>" + n + "</option>"; }).join("") +
          "</select></div>" +
          '<button type="submit" class="btn btn-primary btn-sm">Confirm Assignment</button>' +
          "</form>"
        : "") +
      (ui.noteOpen
        ? '<form data-form="note" style="margin-top:16px;">' +
          '<div class="field"><label for="note-text">Note</label><textarea class="text-input" id="note-text" name="note" rows="3" style="width:100%;" placeholder="Add a supervisory note about this bank’s report…"></textarea></div>' +
          '<div class="actions-row"><button type="submit" class="btn btn-primary btn-sm">Save Note</button></div>' +
          "</form>"
        : "") +
      (notes.length
        ? '<div class="notes-list">' +
          notes
            .map(function (n) {
              return '<div class="note-item"><div class="note-meta">' + esc(n.author) + " &middot; " + esc(n.time) + "</div>" + esc(n.text) + "</div>";
            })
            .join("") +
          "</div>"
        : "") +
      "</div>" +
      "</div>"
    );
  }

  global.Views = global.Views || {};
  global.Views.reportDetail = render;
})(window);
