(function (global) {
  "use strict";
  var esc = UI.esc;
  var D = APP_DATA;

  function riskColor(level) {
    return level === "Critical" ? "var(--critical)" : level === "High" ? "#e07a45" : level === "Medium" ? "var(--medium)" : "var(--primary)";
  }

  function systemicInsight(selected) {
    var violators = selected.filter(function (b) { return b.status === "Violation"; });
    if (violators.length === 0) {
      return "No regulatory violations are present among the " + selected.length + " selected bank(s). Capital and liquidity indicators are within acceptable ranges across this group.";
    }
    if (violators.length === 1) {
      var b = violators[0];
      return (
        b.name + " is the only selected bank currently in violation (" +
        (b.car < D.CAR_THRESHOLD ? "CAR " + b.car.toFixed(1) + "% " : "") +
        (b.lcr < D.LCR_THRESHOLD ? "LCR " + b.lcr + "% " : "") +
        "). The Cross-Bank Pattern Analysis agent finds no comparable deterioration among the other selected banks, suggesting this is an isolated, bank-specific issue rather than a sector-wide trend."
      );
    }
    var segments = Array.from(new Set(violators.map(function (b) { return b.segment; })));
    var sameSegment = segments.length === 1;
    return (
      violators.length + " of the " + selected.length + " selected banks (" +
      violators.map(function (b) { return b.name; }).join(", ") +
      ") show capital or liquidity violations" +
      (sameSegment
        ? ", all within the " + segments[0] + " segment. The Cross-Bank Pattern Analysis agent flags this as a potential segment-wide pattern rather than an isolated incident, warranting closer sector monitoring."
        : ", spanning " + segments.length + " different segments (" + segments.join(", ") + "). The Cross-Bank Pattern Analysis agent flags this as a broader, cross-segment pattern that may indicate systemic pressure rather than a single-bank issue.")
    );
  }

  function render(state) {
    var selectedIds = state.comparisonSelection;
    var selected = state.banks.filter(function (b) { return selectedIds.indexOf(b.id) !== -1; });

    var chips = state.banks
      .map(function (b) {
        var active = selectedIds.indexOf(b.id) !== -1;
        return '<button class="chip' + (active ? " active" : "") + '" data-action="toggle-compare-bank" data-id="' + b.id + '">' + esc(b.name) + "</button>";
      })
      .join("");

    var chart = selected.length
      ? Charts.groupedBarChart(
          selected.map(function (b) { return b.name.split(" ")[0]; }),
          { label: "CAR %", color: "var(--primary)", values: selected.map(function (b) { return b.car; }) },
          { label: "LCR % (÷10)", color: "#2f6f8f", values: selected.map(function (b) { return b.lcr / 10; }) },
          { width: 760, height: 260 }
        )
      : "";

    var ranked = selected.slice().sort(function (a, b) { return a.car - b.car; });
    var rankedRows = ranked
      .map(function (b) {
        return (
          "<tr>" +
          '<td class="cell-strong">' + esc(b.name) + "</td>" +
          '<td class="cell-num' + (b.car < D.CAR_THRESHOLD ? " cell-critical" : "") + '">' + b.car.toFixed(1) + "%</td>" +
          '<td class="cell-num' + (b.lcr < D.LCR_THRESHOLD ? " cell-critical" : "") + '">' + b.lcr + "%</td>" +
          '<td class="cell-num">' + (b.monthlyChangeCar >= 0 ? "+" : "") + b.monthlyChangeCar.toFixed(2) + " pp</td>" +
          '<td class="cell-num">' + (b.monthlyChangeLcr >= 0 ? "+" : "") + b.monthlyChangeLcr.toFixed(1) + " pp</td>" +
          "<td>" + UI.riskPill(b.riskLevel) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    var indicators = [
      { key: "car", label: "CAR", get: function (b) { return b.car; }, good: 16, bad: 7 },
      { key: "lcr", label: "LCR", get: function (b) { return b.lcr; }, good: 160, bad: 70 },
      { key: "npl", label: "NPL", get: function (b) { return b.npl; }, good: 0.5, bad: 6, invert: true },
      { key: "leverage", label: "Leverage", get: function (b) { return b.leverage; }, good: 10, bad: 3 },
    ];

    var heatHead = "<tr><th>Bank</th>" + indicators.map(function (i) { return "<th>" + i.label + "</th>"; }).join("") + "</tr>";
    var heatRows = selected
      .map(function (b) {
        var cells = indicators
          .map(function (ind) {
            var v = ind.get(b);
            var t = (v - ind.bad) / (ind.good - ind.bad);
            if (ind.invert) t = 1 - t;
            var color = Charts.heatColor(t);
            return '<td><div class="heat-cell" style="background:' + color + ';color:#fff;">' + v + "</div></td>";
          })
          .join("");
        return "<tr><td class=\"cell-strong\" style=\"text-align:left;\">" + esc(b.name) + "</td>" + cells + "</tr>";
      })
      .join("");

    return (
      "" +
      UI.eyebrow("04", "Peer Analysis") +
      '<h1 class="page-title">Bank Comparison</h1>' +
      '<p class="page-sub">Compare capital and liquidity indicators across banks to identify isolated issues versus sector-wide patterns.</p>' +
      UI.disclaimer() +
      '<div class="field" style="margin-bottom:10px;"><label>Select Banks to Compare (up to 6)</label></div>' +
      '<div class="bank-select-row">' + chips + "</div>" +
      (selected.length === 0
        ? '<div class="empty-state"><div class="em-title">No banks selected</div>Select at least one bank above to compare indicators.</div>'
        : "" +
          '<div class="panel">' +
          '<div class="panel-head"><span class="panel-title">CAR vs. LCR Comparison</span><span class="panel-note">LCR shown ÷10 for scale</span></div>' +
          '<div class="panel-body">' +
          '<div class="chart-legend"><span class="legend-item"><span class="legend-swatch" style="background:var(--primary)"></span>CAR</span><span class="legend-item"><span class="legend-swatch" style="background:#2f6f8f"></span>LCR (÷10)</span></div>' +
          chart +
          "</div>" +
          "</div>" +
          '<div class="panel">' +
          '<div class="panel-head"><span class="panel-title">Ranked Comparison</span><span class="panel-note">Sorted by CAR, weakest first</span></div>' +
          '<div class="panel-body table-wrap"><table class="data-table"><thead><tr><th>Bank</th><th>CAR</th><th>LCR</th><th>CAR Δ (mo.)</th><th>LCR Δ (mo.)</th><th>Risk Level</th></tr></thead><tbody>' + rankedRows + "</tbody></table></div>" +
          "</div>" +
          '<div class="panel">' +
          '<div class="panel-head"><span class="panel-title">Cross-Bank Heatmap</span><span class="panel-note">Green = stronger, red = weaker</span></div>' +
          '<div class="panel-body table-wrap"><table class="data-table heatmap-table"><thead>' + heatHead + "</thead><tbody>" + heatRows + "</tbody></table></div>" +
          "</div>" +
          '<div class="panel">' +
          '<div class="panel-head"><span class="panel-title">Systemic Insight</span>' + UI.agentTag("Cross-Bank Pattern Analysis") + "</div>" +
          '<div class="panel-body"><div class="explain-box">' + esc(systemicInsight(selected)) + "</div></div>" +
          "</div>")
    );
  }

  global.Views = global.Views || {};
  global.Views.comparison = render;
})(window);
