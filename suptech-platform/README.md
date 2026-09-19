# SupTech — Intelligent Multi-Agent System for Banking Regulatory Supervision

A high-fidelity, interactive front-end prototype of a SupTech platform for bank
report intake, capital/liquidity ratio monitoring, AI-assisted violation
detection, bank comparison, and regulatory report generation.

This is a standalone static web app (no build step, no external framework)
kept separate from the TaskWidget desktop app in the rest of this repository.

**All data and regulatory rules shown are simulated for proof-of-concept
purposes only. They do not represent real banking data or a final regulatory
decision.**

## Running locally

Any static file server works, e.g.:

```bash
cd suptech-platform
python3 -m http.server 8080
# then open http://localhost:8080
```

or

```bash
npx serve suptech-platform
```

Opening `index.html` directly by double-clicking also works, since the app
uses plain (non-module) scripts with no fetch calls.

## Demo login

Use the **"Use demo supervisor account"** link on the login screen to jump
straight to the dashboard, or sign in with any non-empty email/password.

## Structure

```
suptech-platform/
  index.html
  css/styles.css        design system (colors, type, components)
  js/data.js             simulated banks, reports, alerts, audit trail, agents
  js/store.js             app state + actions (pub/sub, no framework)
  js/charts.js            dependency-free SVG chart renderers
  js/ui.js                 sidebar/topbar/badges/toast shared components
  js/views/*.js            one render function per screen
  js/main.js               router + event delegation + boot
```

## Screens

1. Login
2. Dashboard (Banking Supervision Overview)
3. Bank Reports (search/sort/filter + upload pipeline simulation)
4. Bank Report Detail (CAR/LCR calculation, AI explanation, regulatory reference)
5. Alert Center (tabs, filters, side panel, decision actions)
6. Bank Comparison (multi-select, chart, ranked table, heatmap, systemic insight)
7. Final Reports (structured preview + approval workflow)
8. Audit Trail (expandable agent/supervisor action log)
9. Settings (account + the six supervision agents)

## The six agents

Report Ingestion, Rule Matching, Anomaly Detection, Cross-Bank Pattern
Analysis, Explanation Agent (LLM + RAG), and Alert Prioritization — referenced
throughout the audit trail, alert explanations, and the Settings screen.
