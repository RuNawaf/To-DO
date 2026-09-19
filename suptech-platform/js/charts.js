/* Lightweight dependency-free SVG chart builders. Return HTML strings. */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  // ---- Multi-line chart (e.g. CAR / LCR trend) ----
  // series: [{ label, color, values, dash }]  values.length === labels.length
  function lineChart(opts) {
    var w = opts.width || 720;
    var h = opts.height || 260;
    var padL = 40, padR = 16, padT = 16, padB = 28;
    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    var labels = opts.labels;
    var series = opts.series;
    var allVals = [];
    series.forEach(function (s) { allVals = allVals.concat(s.values); });
    if (opts.thresholds) opts.thresholds.forEach(function (t) { allVals.push(t.value); });
    var min = Math.min.apply(null, allVals);
    var max = Math.max.apply(null, allVals);
    var pad = (max - min) * 0.15 || 1;
    min -= pad; max += pad;

    function x(i) { return padL + (innerW * i) / (labels.length - 1); }
    function y(v) { return padT + innerH - ((v - min) / (max - min)) * innerH; }

    var gridLines = "";
    var ticks = 4;
    for (var g = 0; g <= ticks; g++) {
      var v = min + ((max - min) * g) / ticks;
      var gy = y(v);
      gridLines +=
        '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="0" y="' + (gy + 4) + '" font-size="10" fill="var(--text-faint)">' + v.toFixed(1) + '</text>';
    }

    var xLabels = "";
    labels.forEach(function (l, i) {
      if (i % 2 !== 0 && labels.length > 8) return;
      xLabels += '<text x="' + x(i) + '" y="' + (h - 6) + '" font-size="10" fill="var(--text-faint)" text-anchor="middle">' + esc(l) + "</text>";
    });

    var thresholds = "";
    (opts.thresholds || []).forEach(function (t) {
      var ty = y(t.value);
      thresholds +=
        '<line x1="' + padL + '" y1="' + ty + '" x2="' + (w - padR) + '" y2="' + ty + '" stroke="' + t.color + '" stroke-width="1.4" stroke-dasharray="4 3"/>' +
        '<text x="' + (w - padR) + '" y="' + (ty - 4) + '" font-size="10" fill="' + t.color + '" text-anchor="end">' + esc(t.label) + "</text>";
    });

    var lines = "";
    series.forEach(function (s) {
      var d = s.values
        .map(function (v, i) {
          return (i === 0 ? "M" : "L") + x(i).toFixed(1) + "," + y(v).toFixed(1);
        })
        .join(" ");
      lines +=
        '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" ' +
        (s.dash ? 'stroke-dasharray="' + s.dash + '"' : "") + '/>';
      s.values.forEach(function (v, i) {
        lines += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="2.6" fill="' + s.color + '"><title>' + esc(s.label) + " — " + esc(labels[i]) + ": " + v + "</title></circle>";
      });
    });

    return (
      '<svg class="chart-svg" viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trend chart">' +
      gridLines + xLabels + thresholds + lines +
      "</svg>"
    );
  }

  // ---- horizontal bar distribution ----
  function hBarChart(items, opts) {
    opts = opts || {};
    var w = opts.width || 420;
    var rowH = 34;
    var h = items.length * rowH + 10;
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var labelW = 90;
    var barMaxW = w - labelW - 60;
    var rows = items
      .map(function (it, i) {
        var barW = (it.value / max) * barMaxW;
        var y = i * rowH + 8;
        return (
          '<text x="0" y="' + (y + 15) + '" font-size="11" fill="var(--text)" font-weight="600">' + esc(it.label) + "</text>" +
          '<rect x="' + labelW + '" y="' + y + '" width="' + barMaxW + '" height="16" fill="var(--surface-2)"/>' +
          '<rect x="' + labelW + '" y="' + y + '" width="' + barW + '" height="16" fill="' + it.color + '"/>' +
          '<text x="' + (labelW + barMaxW + 10) + '" y="' + (y + 13) + '" font-size="11" fill="var(--text)" font-weight="700">' + it.value + "</text>"
        );
      })
      .join("");
    return '<svg class="chart-svg" viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Distribution chart">' + rows + "</svg>";
  }

  // ---- grouped bar chart (compare CAR/LCR across banks) ----
  function groupedBarChart(labels, seriesA, seriesB, opts) {
    opts = opts || {};
    var w = opts.width || 720;
    var h = opts.height || 260;
    var padL = 40, padR = 16, padT = 16, padB = 34;
    var innerW = w - padL - padR;
    var innerH = h - padT - padB;
    var groupW = innerW / labels.length;
    var barW = Math.min(26, groupW / 3);
    var max = Math.max.apply(null, seriesA.values.concat(seriesB.values)) * 1.15;

    function y(v) { return padT + innerH - (v / max) * innerH; }

    var gridLines = "";
    for (var g = 0; g <= 4; g++) {
      var v = (max * g) / 4;
      var gy = y(v);
      gridLines += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"/>' +
        '<text x="0" y="' + (gy + 4) + '" font-size="10" fill="var(--text-faint)">' + Math.round(v) + "</text>";
    }

    var bars = "";
    labels.forEach(function (l, i) {
      var gx = padL + i * groupW + groupW / 2;
      var ax = gx - barW - 2;
      var bx = gx + 2;
      var av = seriesA.values[i], bv = seriesB.values[i];
      bars +=
        '<rect x="' + ax + '" y="' + y(av) + '" width="' + barW + '" height="' + (padT + innerH - y(av)) + '" fill="' + seriesA.color + '"><title>' + esc(seriesA.label) + " " + esc(l) + ": " + av + "</title></rect>" +
        '<rect x="' + bx + '" y="' + y(bv) + '" width="' + barW + '" height="' + (padT + innerH - y(bv)) + '" fill="' + seriesB.color + '"><title>' + esc(seriesB.label) + " " + esc(l) + ": " + bv + "</title></rect>" +
        '<text x="' + gx + '" y="' + (h - 10) + '" font-size="10" fill="var(--text-faint)" text-anchor="middle">' + esc(l) + "</text>";
    });

    return '<svg class="chart-svg" viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Comparison chart">' + gridLines + bars + "</svg>";
  }

  // ---- donut chart for risk distribution ----
  function donutChart(items, opts) {
    opts = opts || {};
    var size = opts.size || 180;
    var r = size / 2 - 10;
    var cx = size / 2, cy = size / 2;
    var total = items.reduce(function (s, i) { return s + i.value; }, 0) || 1;
    var start = -Math.PI / 2;
    var paths = "";
    items.forEach(function (it) {
      var angle = (it.value / total) * Math.PI * 2;
      var end = start + angle;
      var x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      var x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      var large = angle > Math.PI ? 1 : 0;
      paths += '<path d="M' + cx + "," + cy + " L" + x1.toFixed(2) + "," + y1.toFixed(2) +
        " A" + r + "," + r + " 0 " + large + " 1 " + x2.toFixed(2) + "," + y2.toFixed(2) + ' Z" fill="' + it.color + '"><title>' + esc(it.label) + ": " + it.value + "</title></path>";
      start = end;
    });
    paths += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.58) + '" fill="var(--surface)"/>';
    paths += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text)">' + total + "</text>";
    paths += '<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="9" fill="var(--text-faint)" letter-spacing="0.05em">BANKS</text>';
    return '<svg class="chart-svg" viewBox="0 0 ' + size + " " + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Risk distribution">' + paths + "</svg>";
  }

  function heatColor(t) {
    // t: 0..1 where 1 = best (green), 0.5 = medium (amber), 0 = worst (red)
    t = Math.max(0, Math.min(1, t));
    var stops = [
      [198, 40, 30], // critical red
      [162, 102, 26], // medium amber
      [7, 90, 57], // primary green
    ];
    var seg = t < 0.5 ? 0 : 1;
    var localT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    var from = stops[seg], to = stops[seg + 1];
    var mix = from.map(function (c, i) { return Math.round(c + (to[i] - c) * localT); });
    return "rgb(" + mix.join(",") + ")";
  }

  global.Charts = {
    lineChart: lineChart,
    hBarChart: hBarChart,
    groupedBarChart: groupedBarChart,
    donutChart: donutChart,
    heatColor: heatColor,
  };
})(window);
