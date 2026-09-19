/* ============================================================
   Intelligent Multi-Agent System for Banking Regulatory Supervision
   Mock data layer — all data below is simulated for proof-of-concept
   purposes only. No real banking data or regulatory decisions.
   ============================================================ */

(function (global) {
  "use strict";

  var AGENTS = [
    {
      id: "agent-ingestion",
      name: "Report Ingestion",
      role: "Parses submitted files (Excel, PDF, XBRL) and standardizes them into the internal data model.",
    },
    {
      id: "agent-rules",
      name: "Rule Matching",
      role: "Evaluates standardized figures against Basel III / local regulatory thresholds.",
    },
    {
      id: "agent-anomaly",
      name: "Anomaly Detection",
      role: "Flags statistical outliers and irregular movements versus a bank's own history.",
    },
    {
      id: "agent-crossbank",
      name: "Cross-Bank Pattern Analysis",
      role: "Compares a finding against peer banks to detect sector-wide or isolated patterns.",
    },
    {
      id: "agent-explain",
      name: "Explanation Agent (LLM + RAG)",
      role: "Generates a plain-language explanation grounded in retrieved regulatory text.",
    },
    {
      id: "agent-priority",
      name: "Alert Prioritization",
      role: "Scores and ranks alerts by severity, confidence, and potential systemic impact.",
    },
  ];

  // ---- helper: 12-month labels ending at current simulated month ----
  var MONTHS = [
    "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025",
    "Apr 2025", "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025",
  ];

  function series(start, end, noise) {
    var out = [];
    for (var i = 0; i < MONTHS.length; i++) {
      var t = i / (MONTHS.length - 1);
      var base = start + (end - start) * t;
      var wobble = Math.sin(i * 1.7) * noise;
      out.push(Math.round((base + wobble) * 10) / 10);
    }
    return out;
  }

  var CAR_THRESHOLD = 10.5;
  var LCR_THRESHOLD = 100;

  var BANKS = [
    {
      id: "horizon",
      name: "Horizon Bank",
      segment: "Commercial",
      car: 9.4,
      lcr: 118,
      carSeries: series(11.6, 9.4, 0.25),
      lcrSeries: series(129, 118, 3),
      riskLevel: "Critical",
      status: "Violation",
      npl: 4.1,
      leverage: 5.2,
      monthlyChangeCar: -0.6,
      monthlyChangeLcr: -2.0,
    },
    {
      id: "atlas",
      name: "Atlas National Bank",
      segment: "Retail",
      car: 12.1,
      lcr: 132,
      carSeries: series(11.4, 12.1, 0.2),
      lcrSeries: series(126, 132, 2.5),
      riskLevel: "Low",
      status: "Compliant",
      npl: 1.8,
      leverage: 7.1,
      monthlyChangeCar: 0.2,
      monthlyChangeLcr: 1.1,
    },
    {
      id: "summit",
      name: "Summit Trust Bank",
      segment: "Corporate",
      car: 10.6,
      lcr: 96,
      carSeries: series(11.1, 10.6, 0.2),
      lcrSeries: series(104, 96, 2),
      riskLevel: "High",
      status: "Violation",
      npl: 3.2,
      leverage: 6.0,
      monthlyChangeCar: -0.1,
      monthlyChangeLcr: -1.4,
    },
    {
      id: "meridian",
      name: "Meridian Commercial Bank",
      segment: "Commercial",
      car: 13.4,
      lcr: 140,
      carSeries: series(12.9, 13.4, 0.2),
      lcrSeries: series(134, 140, 2),
      riskLevel: "Low",
      status: "Compliant",
      npl: 1.1,
      leverage: 8.0,
      monthlyChangeCar: 0.1,
      monthlyChangeLcr: 0.8,
    },
    {
      id: "coastal",
      name: "Coastal Union Bank",
      segment: "Retail",
      car: 8.9,
      lcr: 88,
      carSeries: series(10.9, 8.9, 0.3),
      lcrSeries: series(101, 88, 3),
      riskLevel: "Critical",
      status: "Violation",
      npl: 5.4,
      leverage: 4.6,
      monthlyChangeCar: -0.8,
      monthlyChangeLcr: -3.1,
    },
    {
      id: "pinnacle",
      name: "Pinnacle Savings Bank",
      segment: "Retail",
      car: 11.8,
      lcr: 121,
      carSeries: series(11.5, 11.8, 0.15),
      lcrSeries: series(118, 121, 1.5),
      riskLevel: "Low",
      status: "Compliant",
      npl: 1.6,
      leverage: 7.4,
      monthlyChangeCar: 0.05,
      monthlyChangeLcr: 0.4,
    },
    {
      id: "sterling",
      name: "Sterling Capital Bank",
      segment: "Corporate",
      car: 10.7,
      lcr: 104,
      carSeries: series(11.2, 10.7, 0.2),
      lcrSeries: series(110, 104, 2),
      riskLevel: "Medium",
      status: "Review Required",
      npl: 2.6,
      leverage: 6.3,
      monthlyChangeCar: -0.15,
      monthlyChangeLcr: -0.9,
    },
    {
      id: "vanguard",
      name: "Vanguard Community Bank",
      segment: "Retail",
      car: 14.0,
      lcr: 150,
      carSeries: series(13.6, 14.0, 0.15),
      lcrSeries: series(146, 150, 1.5),
      riskLevel: "Low",
      status: "Compliant",
      npl: 0.9,
      leverage: 8.6,
      monthlyChangeCar: 0.12,
      monthlyChangeLcr: 0.6,
    },
    {
      id: "brookline",
      name: "Brookline Federal Bank",
      segment: "Commercial",
      car: 12.6,
      lcr: 112,
      carSeries: series(12.1, 12.6, 0.2),
      lcrSeries: series(108, 112, 2),
      riskLevel: "Low",
      status: "Compliant",
      npl: 2.0,
      leverage: 7.0,
      monthlyChangeCar: 0.1,
      monthlyChangeLcr: 0.5,
    },
    {
      id: "ironford",
      name: "Ironford Trust Bank",
      segment: "Corporate",
      car: 10.9,
      lcr: 99,
      carSeries: series(11.3, 10.9, 0.2),
      lcrSeries: series(106, 99, 2.2),
      riskLevel: "Medium",
      status: "Review Required",
      npl: 2.9,
      leverage: 6.1,
      monthlyChangeCar: -0.2,
      monthlyChangeLcr: -1.0,
    },
    {
      id: "westgate",
      name: "Westgate National Bank",
      segment: "Retail",
      car: 12.9,
      lcr: 128,
      carSeries: series(12.4, 12.9, 0.15),
      lcrSeries: series(123, 128, 1.8),
      riskLevel: "Low",
      status: "Compliant",
      npl: 1.4,
      leverage: 7.6,
      monthlyChangeCar: 0.08,
      monthlyChangeLcr: 0.5,
    },
    {
      id: "cliffstone",
      name: "Cliffstone Savings & Loan",
      segment: "Retail",
      car: 9.9,
      lcr: 94,
      carSeries: series(10.7, 9.9, 0.2),
      lcrSeries: series(103, 94, 2.5),
      riskLevel: "High",
      status: "Violation",
      npl: 3.8,
      leverage: 5.5,
      monthlyChangeCar: -0.35,
      monthlyChangeLcr: -1.8,
    },
  ];

  // sector-wide CAR/LCR average series for the dashboard trend chart
  var SECTOR_CAR_SERIES = series(11.5, 11.3, 0.15);
  var SECTOR_LCR_SERIES = series(116, 113, 1.6);

  function fmtDate(offsetDays) {
    var d = new Date("2025-09-19T09:00:00Z");
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function fmtDateTime(offsetHours) {
    var d = new Date("2025-09-19T09:00:00Z");
    d.setHours(d.getHours() - offsetHours);
    return d.toISOString().slice(0, 16).replace("T", " ");
  }

  var REPORTS = [
    { id: "R-2309-HZ", bankId: "horizon", period: "Q3 2025", fileType: "XBRL", car: 9.4, lcr: 118, status: "Violation", submitted: fmtDate(2) },
    { id: "R-2309-AT", bankId: "atlas", period: "Q3 2025", fileType: "Excel", car: 12.1, lcr: 132, status: "Compliant", submitted: fmtDate(3) },
    { id: "R-2309-SM", bankId: "summit", period: "Q3 2025", fileType: "PDF", car: 10.6, lcr: 96, status: "Violation", submitted: fmtDate(1) },
    { id: "R-2309-MR", bankId: "meridian", period: "Q3 2025", fileType: "XBRL", car: 13.4, lcr: 140, status: "Compliant", submitted: fmtDate(4) },
    { id: "R-2309-CS", bankId: "coastal", period: "Q3 2025", fileType: "Excel", car: 8.9, lcr: 88, status: "Violation", submitted: fmtDate(1) },
    { id: "R-2309-PN", bankId: "pinnacle", period: "Q3 2025", fileType: "XBRL", car: 11.8, lcr: 121, status: "Compliant", submitted: fmtDate(5) },
    { id: "R-2309-ST", bankId: "sterling", period: "Q3 2025", fileType: "PDF", car: 10.7, lcr: 104, status: "Review Required", submitted: fmtDate(2) },
    { id: "R-2309-VG", bankId: "vanguard", period: "Q3 2025", fileType: "Excel", car: 14.0, lcr: 150, status: "Compliant", submitted: fmtDate(6) },
    { id: "R-2309-BR", bankId: "brookline", period: "Q3 2025", fileType: "XBRL", car: 12.6, lcr: 112, status: "Compliant", submitted: fmtDate(3) },
    { id: "R-2309-IF", bankId: "ironford", period: "Q3 2025", fileType: "PDF", car: 10.9, lcr: 99, status: "Review Required", submitted: fmtDate(2) },
    { id: "R-2309-WG", bankId: "westgate", period: "Q3 2025", fileType: "Excel", car: 12.9, lcr: 128, status: "Compliant", submitted: fmtDate(7) },
    { id: "R-2309-CF", bankId: "cliffstone", period: "Q3 2025", fileType: "XBRL", car: 9.9, lcr: 94, status: "Violation", submitted: fmtDate(1) },
    { id: "R-2306-HZ", bankId: "horizon", period: "Q2 2025", fileType: "XBRL", car: 10.0, lcr: 121, status: "Review Required", submitted: fmtDate(94) },
    { id: "R-2306-AT", bankId: "atlas", period: "Q2 2025", fileType: "Excel", car: 11.9, lcr: 129, status: "Compliant", submitted: fmtDate(95) },
  ];

  var ALERTS = [
    {
      id: "AL-1042",
      bankId: "horizon",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR fell to 9.4%, below the 10.5% Basel III regulatory minimum.",
      severity: "Critical",
      confidence: 96,
      detected: fmtDateTime(6),
      status: "Open",
      agentId: "agent-rules",
      evidence: [
        "Reported Tier 1 + Tier 2 capital: $612.4M",
        "Risk-weighted assets: $6,514.9M",
        "Computed CAR = 612.4 / 6514.9 = 9.4%",
        "Threshold breach persisted for 2 consecutive quarters",
      ],
      regulatoryRule: "Basel III, Minimum Capital Requirements — CAR must not fall below 10.5% (incl. capital conservation buffer).",
      recommendedActions: ["Confirm Violation", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(6), actor: "Rule Matching Agent", action: "Flagged CAR breach", note: "Automatic threshold check on Q3 2025 submission." },
        { time: fmtDateTime(5), actor: "Anomaly Detection Agent", action: "Confirmed downward trend", note: "3rd consecutive quarter of decline, exceeds historical volatility band." },
      ],
    },
    {
      id: "AL-1041",
      bankId: "coastal",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR at 8.9%, 160 bps below regulatory minimum with accelerating decline.",
      severity: "Critical",
      confidence: 98,
      detected: fmtDateTime(8),
      status: "Under Review",
      agentId: "agent-rules",
      evidence: [
        "Reported capital base: $401.7M",
        "Risk-weighted assets: $4,512.4M",
        "Computed CAR = 8.9%",
        "Quarter-over-quarter decline of 0.8 percentage points",
      ],
      regulatoryRule: "Basel III, Minimum Capital Requirements — CAR must not fall below 10.5%.",
      recommendedActions: ["Confirm Violation", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(8), actor: "Rule Matching Agent", action: "Flagged CAR breach", note: "Automatic threshold check." },
        { time: fmtDateTime(7), actor: "Cross-Bank Pattern Analysis Agent", action: "Compared to peer segment", note: "Decline steeper than 90% of retail-segment peers." },
        { time: fmtDateTime(4), actor: "Supervisor: A. Reyes", action: "Marked Under Review", note: "Requested supporting capital plan from bank." },
      ],
    },
    {
      id: "AL-1040",
      bankId: "coastal",
      indicator: "Liquidity Coverage Ratio (LCR)",
      description: "LCR at 88%, below the 100% minimum, indicating a short-term liquidity shortfall.",
      severity: "Critical",
      confidence: 94,
      detected: fmtDateTime(9),
      status: "Open",
      agentId: "agent-rules",
      evidence: [
        "High-Quality Liquid Assets (HQLA): $528.9M",
        "Total net cash outflows (30-day stress): $601.0M",
        "Computed LCR = 528.9 / 601.0 = 88%",
      ],
      regulatoryRule: "Basel III, Liquidity Coverage Ratio — LCR must not fall below 100%.",
      recommendedActions: ["Confirm Violation", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(9), actor: "Rule Matching Agent", action: "Flagged LCR breach", note: "Automatic threshold check." },
      ],
    },
    {
      id: "AL-1039",
      bankId: "summit",
      indicator: "Liquidity Coverage Ratio (LCR)",
      description: "LCR dropped to 96%, marginally below the regulatory minimum.",
      severity: "Medium",
      confidence: 87,
      detected: fmtDateTime(20),
      status: "Open",
      agentId: "agent-rules",
      evidence: [
        "HQLA: $712.0M",
        "Net cash outflows (30-day stress): $741.7M",
        "Computed LCR = 96%",
      ],
      regulatoryRule: "Basel III, Liquidity Coverage Ratio — LCR must not fall below 100%.",
      recommendedActions: ["Request More Information", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(20), actor: "Rule Matching Agent", action: "Flagged LCR breach", note: "Automatic threshold check." },
      ],
    },
    {
      id: "AL-1038",
      bankId: "cliffstone",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR at 9.9%, below regulatory minimum; second breach within 6 months.",
      severity: "Critical",
      confidence: 95,
      detected: fmtDateTime(11),
      status: "Open",
      agentId: "agent-rules",
      evidence: [
        "Reported capital base: $214.6M",
        "Risk-weighted assets: $2,167.7M",
        "Computed CAR = 9.9%",
      ],
      regulatoryRule: "Basel III, Minimum Capital Requirements — CAR must not fall below 10.5%.",
      recommendedActions: ["Confirm Violation", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(11), actor: "Rule Matching Agent", action: "Flagged CAR breach", note: "Automatic threshold check." },
      ],
    },
    {
      id: "AL-1037",
      bankId: "sterling",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR at 10.7%, 20 bps above minimum but trending downward for 3 quarters.",
      severity: "Medium",
      confidence: 78,
      detected: fmtDateTime(30),
      status: "Under Review",
      agentId: "agent-anomaly",
      evidence: [
        "CAR trend: 11.2% → 11.0% → 10.7%",
        "Rate of decline exceeds 2x the bank's 2-year average",
      ],
      regulatoryRule: "Basel III capital buffer guidance — early warning threshold at 25% above minimum.",
      recommendedActions: ["Request More Information", "Send for Review"],
      decisionHistory: [
        { time: fmtDateTime(30), actor: "Anomaly Detection Agent", action: "Flagged accelerating decline", note: "Trend-based early warning, no hard breach yet." },
        { time: fmtDateTime(22), actor: "Supervisor: M. Chen", action: "Marked Under Review", note: "Requesting Q3 capital plan for context." },
      ],
    },
    {
      id: "AL-1036",
      bankId: "ironford",
      indicator: "Liquidity Coverage Ratio (LCR)",
      description: "LCR at 99%, just below minimum, first breach in 8 quarters.",
      severity: "Medium",
      confidence: 81,
      detected: fmtDateTime(28),
      status: "Open",
      agentId: "agent-rules",
      evidence: ["HQLA: $389.5M", "Net cash outflows: $393.4M", "Computed LCR = 99%"],
      regulatoryRule: "Basel III, Liquidity Coverage Ratio — LCR must not fall below 100%.",
      recommendedActions: ["Request More Information", "Send for Review", "Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(28), actor: "Rule Matching Agent", action: "Flagged LCR breach", note: "Marginal, single-quarter breach." },
      ],
    },
    {
      id: "AL-1035",
      bankId: "horizon",
      indicator: "Non-Performing Loans (NPL) Ratio",
      description: "NPL ratio rose to 4.1%, an outlier versus the bank's 2-year trend.",
      severity: "Medium",
      confidence: 83,
      detected: fmtDateTime(40),
      status: "Under Review",
      agentId: "agent-anomaly",
      evidence: ["NPL ratio trend: 2.6% → 3.3% → 4.1%", "Z-score versus 8-quarter history: 2.4"],
      regulatoryRule: "Internal supervisory guidance — NPL deterioration above 1.5 std. dev. triggers review.",
      recommendedActions: ["Request More Information", "Send for Review"],
      decisionHistory: [
        { time: fmtDateTime(40), actor: "Anomaly Detection Agent", action: "Flagged NPL outlier", note: "Statistical deviation from bank's own history." },
        { time: fmtDateTime(33), actor: "Supervisor: A. Reyes", action: "Marked Under Review", note: "Bundled with CAR breach investigation." },
      ],
    },
    {
      id: "AL-1034",
      bankId: "pinnacle",
      indicator: "Leverage Ratio",
      description: "Leverage ratio dipped slightly quarter-over-quarter; within tolerance, informational only.",
      severity: "Low",
      confidence: 62,
      detected: fmtDateTime(50),
      status: "Closed",
      agentId: "agent-anomaly",
      evidence: ["Leverage ratio: 7.6% → 7.4%", "Still well above 3% regulatory floor"],
      regulatoryRule: "Basel III Leverage Ratio — minimum 3%.",
      recommendedActions: ["Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(50), actor: "Anomaly Detection Agent", action: "Flagged minor deviation", note: "Below materiality threshold." },
        { time: fmtDateTime(45), actor: "Supervisor: M. Chen", action: "Closed alert", note: "No regulatory concern; within normal range." },
      ],
    },
    {
      id: "AL-1033",
      bankId: "westgate",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR steady at 12.9%; flagged only for routine quarterly confirmation.",
      severity: "Low",
      confidence: 55,
      detected: fmtDateTime(60),
      status: "Closed",
      agentId: "agent-priority",
      evidence: ["CAR stable across last 4 quarters", "No threshold proximity"],
      regulatoryRule: "Routine monitoring — no rule breach.",
      recommendedActions: ["Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(60), actor: "Alert Prioritization Agent", action: "Low-priority informational flag", note: "Routine confirmation only." },
        { time: fmtDateTime(58), actor: "Supervisor: A. Reyes", action: "Closed alert", note: "No action required." },
      ],
    },
    {
      id: "AL-1032",
      bankId: "summit",
      indicator: "Capital Adequacy Ratio (CAR)",
      description: "CAR at 10.6%, narrowly above minimum; buffer erosion detected across segment.",
      severity: "Medium",
      confidence: 74,
      detected: fmtDateTime(35),
      status: "Open",
      agentId: "agent-crossbank",
      evidence: ["CAR buffer over minimum: 10 bps", "3 of 4 corporate-segment banks show similar erosion"],
      regulatoryRule: "Basel III capital buffer guidance — early warning threshold.",
      recommendedActions: ["Request More Information", "Send for Review"],
      decisionHistory: [
        { time: fmtDateTime(35), actor: "Cross-Bank Pattern Analysis Agent", action: "Flagged sector-wide buffer erosion", note: "Pattern shared with 3 peer banks." },
      ],
    },
    {
      id: "AL-1031",
      bankId: "vanguard",
      indicator: "Liquidity Coverage Ratio (LCR)",
      description: "LCR at 150%, comfortably above minimum; flagged for unusually rapid increase.",
      severity: "Low",
      confidence: 58,
      detected: fmtDateTime(65),
      status: "Closed",
      agentId: "agent-anomaly",
      evidence: ["LCR rose 8 points quarter-over-quarter", "Still within normal operating range"],
      regulatoryRule: "Routine monitoring — no rule breach.",
      recommendedActions: ["Close Alert"],
      decisionHistory: [
        { time: fmtDateTime(65), actor: "Anomaly Detection Agent", action: "Flagged rapid increase", note: "Informational only, no risk indicated." },
        { time: fmtDateTime(62), actor: "Supervisor: M. Chen", action: "Closed alert", note: "Verified as a one-off deposit inflow." },
      ],
    },
  ];

  var AUDIT_TRAIL = [
    {
      id: "AT-9001",
      time: fmtDateTime(6),
      agent: "Report Ingestion",
      operation: "Parsed XBRL submission for Horizon Bank (Q3 2025)",
      inputs: "File: horizon_q3_2025.xbrl (2.4 MB)",
      result: "Standardized 128 data points into internal schema",
      confidence: 99,
    },
    {
      id: "AT-9002",
      time: fmtDateTime(6),
      agent: "Rule Matching",
      operation: "Evaluated CAR against Basel III minimum (10.5%)",
      inputs: "CAR = 9.4% (Horizon Bank, Q3 2025)",
      result: "Threshold breach detected — Alert AL-1042 created",
      confidence: 96,
    },
    {
      id: "AT-9003",
      time: fmtDateTime(5),
      agent: "Anomaly Detection",
      operation: "Checked 8-quarter CAR trend for Horizon Bank",
      inputs: "CAR series: 11.6, 11.1, 10.7, 10.3, 10.0, 9.8, 9.6, 9.4",
      result: "Confirmed sustained downward trend, 3rd consecutive breach quarter",
      confidence: 92,
    },
    {
      id: "AT-9004",
      time: fmtDateTime(5),
      agent: "Explanation Agent (LLM + RAG)",
      operation: "Generated plain-language explanation for AL-1042",
      inputs: "Alert AL-1042, Basel III capital adequacy provisions",
      result: "Explanation drafted and linked to regulatory reference excerpt",
      confidence: 90,
    },
    {
      id: "AT-9005",
      time: fmtDateTime(4),
      agent: "Alert Prioritization",
      operation: "Scored and ranked open alerts",
      inputs: "12 open/under-review alerts across 8 banks",
      result: "AL-1042 and AL-1041 ranked Critical priority (top 2)",
      confidence: 94,
    },
    {
      id: "AT-9006",
      time: fmtDateTime(8),
      agent: "Rule Matching",
      operation: "Evaluated CAR against Basel III minimum (10.5%)",
      inputs: "CAR = 8.9% (Coastal Union Bank, Q3 2025)",
      result: "Threshold breach detected — Alert AL-1041 created",
      confidence: 98,
    },
    {
      id: "AT-9007",
      time: fmtDateTime(7),
      agent: "Cross-Bank Pattern Analysis",
      operation: "Compared Coastal Union Bank decline against retail-segment peers",
      inputs: "5 retail-segment banks, 4-quarter CAR deltas",
      result: "Decline steeper than 90% of peers — isolated, not sector-wide",
      confidence: 88,
    },
    {
      id: "AT-9008",
      time: fmtDateTime(4),
      agent: "Supervisor: A. Reyes",
      operation: "Marked AL-1041 as Under Review",
      inputs: "Alert AL-1041",
      result: "Requested capital restoration plan from Coastal Union Bank",
      confidence: null,
    },
    {
      id: "AT-9009",
      time: fmtDateTime(9),
      agent: "Rule Matching",
      operation: "Evaluated LCR against Basel III minimum (100%)",
      inputs: "LCR = 88% (Coastal Union Bank, Q3 2025)",
      result: "Threshold breach detected — Alert AL-1040 created",
      confidence: 94,
    },
    {
      id: "AT-9010",
      time: fmtDateTime(35),
      agent: "Cross-Bank Pattern Analysis",
      operation: "Compared capital buffer erosion across corporate-segment banks",
      inputs: "4 corporate-segment banks, CAR buffer over minimum",
      result: "3 of 4 banks show buffer erosion — flagged as sector-wide pattern",
      confidence: 74,
    },
    {
      id: "AT-9011",
      time: fmtDateTime(45),
      agent: "Supervisor: M. Chen",
      operation: "Closed alert AL-1034",
      inputs: "Alert AL-1034",
      result: "No regulatory concern; leverage ratio within normal range",
      confidence: null,
    },
    {
      id: "AT-9012",
      time: fmtDateTime(3),
      agent: "Report Ingestion",
      operation: "Parsed Excel submission for Atlas National Bank (Q3 2025)",
      inputs: "File: atlas_q3_2025.xlsx (1.1 MB)",
      result: "Standardized 128 data points into internal schema",
      confidence: 99,
    },
    {
      id: "AT-9013",
      time: fmtDateTime(2),
      agent: "Rule Matching",
      operation: "Evaluated CAR and LCR for Atlas National Bank",
      inputs: "CAR = 12.1%, LCR = 132%",
      result: "No breach — all indicators compliant",
      confidence: 97,
    },
  ];

  var REGULATORY_REFERENCE = {
    title: "Basel III — Minimum Capital Requirements (demo excerpt)",
    excerpt:
      "“Banks must maintain a minimum Total Capital Ratio of 8%, plus a Capital Conservation Buffer of 2.5%, resulting in an effective minimum of 10.5% of risk-weighted assets at all times. A bank whose ratio falls below this combined requirement is considered non-compliant and subject to capital distribution constraints and supervisory action.”",
    source: "Basel Committee on Banking Supervision — Basel III Framework (simulated excerpt for this prototype)",
  };

  var RISK_LEVEL_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  var SEVERITY_ORDER = { Critical: 0, Medium: 1, Low: 2 };

  // Simulated "now" for in-session actions, anchored to the prototype's
  // reference date so manual actions stay chronologically consistent with
  // the rest of the simulated dataset regardless of the real system clock.
  var SIM_ANCHOR = Date.parse("2025-09-19T09:00:00Z");
  var simClockOffset = 0;
  function simNow() {
    simClockOffset += 1;
    return new Date(SIM_ANCHOR + simClockOffset * 60000);
  }
  function simNowStr() {
    return simNow().toISOString().slice(0, 16).replace("T", " ");
  }

  global.APP_DATA = {
    AGENTS: AGENTS,
    MONTHS: MONTHS,
    BANKS: BANKS,
    REPORTS: REPORTS,
    ALERTS: ALERTS,
    AUDIT_TRAIL: AUDIT_TRAIL,
    REGULATORY_REFERENCE: REGULATORY_REFERENCE,
    SECTOR_CAR_SERIES: SECTOR_CAR_SERIES,
    SECTOR_LCR_SERIES: SECTOR_LCR_SERIES,
    CAR_THRESHOLD: CAR_THRESHOLD,
    LCR_THRESHOLD: LCR_THRESHOLD,
    RISK_LEVEL_ORDER: RISK_LEVEL_ORDER,
    SEVERITY_ORDER: SEVERITY_ORDER,
    simNowStr: simNowStr,
  };
})(window);
