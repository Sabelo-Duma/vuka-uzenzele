# Product Brief: IntelliSource

**Project:** IntelliSource — AI-Driven Sourcing & Contracting Platform
**Owner:** Gijima Procurement Business Unit
**Author:** BMad Product Owner Agent
**Date:** 2026-07-24
**Status:** Approved for PRD
**Inputs:** research-brief.md, IntelliSource Expanded Business Case v1, Gijima Architecture Design Principles

---

## 1. Vision

**IntelliSource is the Autonomous Procurement Orchestrator: an AI-driven, Microsoft-native, end-to-end sourcing and contracting platform that turns plain-language business needs into governed RFx events, discovers and invites suppliers, evaluates bids with explainable AI, orchestrates stakeholders inside Microsoft Teams, and drives to contract award — with a court-grade audit trail and built-in South African compliance.**

One sentence: *From "I need 200 laptops" typed in Teams to a signed, auditable contract award — in days, not months.*

## 2. Problem Statement

Organizations waste 60–70% of sourcing cycle time on manual intake, RFx preparation, supplier lookup, and committee approvals. Requirements arrive as vague emails; buyers re-type them into Word templates; supplier lists are stale ERP extracts; bids arrive as email attachments viewed prematurely (compliance risk); evaluation happens in spreadsheets with no scoring audit trail; committee approvals crawl through calendars; and when auditors ask "prove this award was fair," the evidence is scattered across mailboxes.

Existing platforms don't fix this for our market:

- **Legacy suites (SAP Ariba, Coupa, GEP, Ivalua, Jaggaer)** cost $250k+/year, take 6–18 months to deploy, require consultants, and charge suppliers network fees. All now have AI copilots — but none are Microsoft Teams-native, none automate South African B-BBEE/PPPFA preference scoring, and none fit mid-market budgets.
- **AI-native challengers (Zip, Levelpath, Fairmarkit)** prove the demand for conversational intake and autonomous sourcing but are US-centric, lack RFx-to-contract depth, and have zero African compliance coverage.
- **Manual/email processes** — the actual incumbent for most African mid-market and public-sector organizations — offer no auditability, no cycle-time control, and growing regulatory exposure (POPIA, King V, Public Procurement Act 2024).

## 3. Target Users (Personas)

### Persona 1 — Nomsa, Business Requester (Operations Manager)
Needs goods/services but is not a procurement professional. **Pain points:** (1) Doesn't know how to write a specification — her email requests bounce back with questions for weeks; (2) has no visibility into where her request sits once submitted; (3) resorting to maverick spend because "procurement takes too long." **Goal:** describe what she needs in plain language in Teams and watch it progress. **Current workflow:** email to procurement → wait → clarification ping-pong → escalate to her director.

### Persona 2 — Thandi, Senior Category Manager (RFx Creator & Sourcing Lead)
8+ years in strategic sourcing, owns high-value events. **Pain points:** (1) Spends 3–4 hours/week converting vague requests into RFx documents and chasing email submissions; (2) cannot prove invitation delivery or keep bids sealed until close — audit exposure; (3) evaluation consolidation in Excel takes days and invites scoring-bias accusations. **Goal:** launch governed events fast, with AI drafting the RFx and scoring support she can defend. **Current workflow:** Word templates + Outlook + shared drives + Excel scoring sheets.

### Persona 3 — Pieter, Head of Procurement / CPO (Governance Owner)
Reports to CFO; faces external auditors and, for SOE clients, Parliament-grade scrutiny. **Pain points:** (1) No real-time pipeline visibility without chasing buyers; (2) cannot rapidly produce audit-ready evidence of fair process (King V, PFMA); (3) B-BBEE preference calculations done by hand and challenged by losing bidders. **Goal:** dashboard oversight, provable governance, automated preference scoring. **Current workflow:** monthly Excel reports, manual audit file assembly.

### Persona 4 — Ahmed, Supplier Respondent (Supply-Chain Manager at mid-sized vendor)
Responds to RFQs/RFPs for multiple customers. **Pain points:** (1) Juggles 8+ different customer portals, each with fees or clunky logins (industry average 8.4); (2) email submissions vanish — no receipt, no deadline clarity, reminders after he's already submitted; (3) version confusion when he updates pricing. **Goal:** one free, mobile-friendly portal with acknowledgement, receipts, versioning, and fair Q&A. **Current workflow:** email attachments and hope.

## 4. Value Proposition

**For** mid-to-large enterprises and public entities standardized on Microsoft 365
**Who** lose months and audit defensibility to manual, fragmented sourcing
**Our product** IntelliSource
**Is an** AI-driven autonomous procurement orchestration platform (Source-to-Contract)
**That** cuts sourcing cycle time ≥30% by turning plain-language needs into governed RFx events, AI-evaluated bids, and Teams-orchestrated decisions with immutable auditability
**Unlike** SAP Ariba/Coupa/GEP (expensive, slow to deploy, not Teams-native, no African compliance) and email/Excel (no governance at all)
**Our product** is Microsoft-native (Teams, Outlook, Entra ID, Agent Store), deploys in weeks at mid-market pricing with zero supplier fees, and ships POPIA/King V/B-BBEE compliance as first-class features.

## 5. Differentiators (defensible order)

1. **South African/African compliance moat** — automated B-BBEE 80/20 & 90/10 preference-point scoring, CSD/SARS/CIPC verification hooks, POPIA-by-design (SA data residency, s72-aware AI routing), King V-grade audit evidence, Public Procurement Act-ready rule packs. No global suite does this.
2. **Microsoft-native orchestration depth** — approvals, committee meetings, e-voting, and notifications inside Teams; Entra ID + MFA; distribution via M365 Agent Store; agents built on Microsoft Agent Framework with MCP/A2A interop so IntelliSource extends (not fights) customer Copilot estates.
3. **End-to-end AI workflow, human-governed** — intake→spec→RFx draft→completeness check→weighted scoring→executive summaries, every AI output with rationale + citations, human confirmation audited. Explainability designed for tender-dispute defensibility.
4. **Speed-to-value economics** — weeks to deploy, $8k/mo mid-market / $18k/mo enterprise, zero supplier fees (explicitly anti-Ariba), free mobile-first supplier portal.
5. **Proven foundation** — RFx lifecycle, supplier portal, and audit framework battle-tested in the Hulamin Supplier Sourcing System (GO-rated 95.9/100), de-risking the MVP build.

## 6. MVP Scope (Stage 1, 0–12 months)

### Must-Have (product doesn't work without these)

**M1. Conversational requirement intake** — plain-language need capture (web + Teams), AI-guided clarification, structured specification generation, category auto-tagging, approval routing to sourcing.
**M2. AI RFx authoring** — generate RFQ/RFP/RFI drafts from the approved spec using template libraries; buyer edits and owns the final document; versioned templates (Hulamin pattern).
**M3. RFx lifecycle & governance engine** — statuses Draft → PendingReview → PendingApproval → Published → Closed (+ Rejected/Returned/Clarification), segregation of duties, mandatory comments on reject/clarify, auto-approval when reviewer=approver, RFQ short path; RFx-YYYY-NNN numbering; clone/edit/delete rules by status. *(Hulamin reuse)*
**M4. Supplier invitation & portal** — invite from supplier master or manual entry; tokenized email invitations (Outlook/Graph); free supplier portal with first-time password setup, acknowledgement-gated document access, versioned draft/final submissions, deadline sealing (bids hidden until close), change requests. *(Hulamin reuse)*
**M5. Sealed-bid evaluation workspace** — two-envelope-capable data model (technical/commercial separation); AI completeness check (missing docs, certs, forms) with gap flags; configurable weighted scoring matrix; AI evaluation summaries with rationale + citations to bid text; side-by-side comparison; human confirm/override with audited reasons.
**M6. Teams orchestration (wedge)** — approval requests as actionable Teams cards; auto-scheduled review/evaluation meetings with agenda + links; event notifications in channels; adaptive-card status queries.
**M7. Immutable audit & evidence** — append-only, hash-chained audit log of every human and AI action (model version + prompt hash for AI); status history; evidence-pack export (PDF/CSV) per event. *(Hulamin framework, hardened)*
**M8. Dashboard & reporting** — real-time pipeline view by status/owner; KPI cards (cycle time, open events, responses); charts with CSV/PDF export; SignalR live updates. *(Hulamin reuse + charts)*
**M9. Identity & admin** — Entra ID SSO + MFA for internal users; roles Initiator/Reviewer/Approver/Administrator/ViewOnly (extensible); user & supplier administration; POPIA data-subject tooling (access/correction/deletion).
**M10. Platform & API foundation** — .NET 10 Clean Architecture, EF Core 10 + PostgreSQL, React + Tailwind (Gijima brand tokens), OpenAPI 3.2 published spec, Docker→AKS deployment, multi-tenant with in-tenant deployment option, virus-scanned uploads, RFC 7807 errors.

### Should-Have (MVP if capacity allows; else first fast-follow)

**S1.** Multi-level/configurable approval chains (Hulamin gap).
**S2.** B-BBEE data capture on supplier profiles (certificate/affidavit upload + level) — scoring engine lands Stage 2, but capture starts now.
**S3.** Anonymous supplier Q&A with addenda broadcast.
**S4.** Notification engine with scheduled reminders (7-day/1-day) and retry management. *(Hulamin reuse — likely in MVP)*
**S5.** Basic savings & cycle-time instrumentation (baseline vs actual per event) — feeds the ROI story.

### Nice-to-Have (explicitly deferred)

- Stage 2 (12–24 mo): AI supplier discovery (web/ESG/EcoVadis), committee blind scoring & e-voting in Teams, multi-round/BAFO, B-BBEE 80/20–90/10 scoring engine + PPPFA staged evaluation, ERP connectors (SAP/Oracle/D365/Sage), demand bundling, savings ledger, ISO 27001/SOC 2 certification work.
- Stage 3 (24–36 mo): contract drafting from award + clause libraries + AI redlining, eSignature, obligation tracking, auction engine, predictive analytics, autonomous negotiation, contract-expiry-triggered re-sourcing, Copilot Agent Store listing.

### Out of Scope (MVP)
Purchase orders/P2P execution, invoicing, inventory, supplier performance management, payment processing, non-Microsoft collaboration surfaces (Slack/GChat).

## 7. Cross-Cutting MVP Decisions

- **Error recovery:** automatic retry with exponential backoff (100/300/900ms, max 3) on transient failures; graceful AI degradation — if AI services are down, every AI-assisted step falls back to manual authoring/scoring, never blocking the sourcing process; queued outbound email/Teams messages with retry + dead-letter; autosave drafts.
- **Accessibility:** WCAG 2.1 AA compliance target (design toward 2.2 AA), enforced in CI (axe scans) + manual screen-reader passes; supplier portal is the highest-exposure surface; publish an ACR — sales asset for public sector.
- **API-first:** the API is a first-class product (Gijima principle #7). OpenAPI 3.2 spec is an MVP deliverable, published at /api/docs; versioned v1; webhooks for event lifecycle.
- **Performance targets:** API p95 <500ms; page LCP <2.5s / INP <200ms; initial bundle <1MB gzipped; architecture sized for 10k+ concurrent users <2s (principle #13); 99.5% app uptime.
- **AI governance:** agents act strictly under the invoking user's permissions; every AI action logged with model version + prompt hash; no customer data used for model training; human-in-the-loop on all award-affecting outputs; SA-resident inference preferred, s72-papered otherwise.

## 8. Success Metrics (KPIs)

| # | Metric | Target | Timeframe | Type |
|---|--------|--------|-----------|------|
| K1 | Sourcing cycle time (intake→award decision), instrumented in-product | ≥30% reduction vs customer baseline | Within 6 months of Customer Zero go-live | Business value |
| K2 | Pilot adoption | Gijima Customer Zero live + 2–3 lighthouse clients; 10 paying customers / ~$1M ARR | Month 12 | Acquisition |
| K3 | Intake conversion | ≥70% of plain-language intakes reach published RFx without manual re-work escalation | Month 9 | Engagement |
| K4 | Supplier experience | ≥90% invited suppliers acknowledge via portal; supplier SUS ≥75; 100% submissions receipted | Month 9 | Engagement |
| K5 | AI evaluation utility | ≥80% of AI completeness flags accepted by evaluators; 100% of AI summaries carry citations; 0 unexplained AI decisions in audit | Continuous | Trust/quality |
| K6 | Technical SLOs | API p95 <500ms; LCP <2.5s; 99.5% uptime; error-recovery success ≥95%; axe a11y score ≥95, 0 critical | Continuous from sprint 1 | Technical |
| K7 | Audit readiness | Evidence pack for any event generated <5 min; 100% actions (human+AI) in immutable log | Continuous | Governance |

## 9. Constraints

- **Architecture:** Gijima's 20 Architecture Design Principles are contractual: .NET 10 Clean Architecture; MVC + React + Tailwind; EF Core→PostgreSQL; Docker local / AKS production; Zero Trust + defence-in-depth; OpenAPI 3.2.0; POPIA; Entra ID SSO + MFA; full audit; microservices with strict boundaries; 10k+ users <2s; 99.5%/99.99% uptime.
- **Branding:** UI implements gijima-styles.css tokens (web palette red #F20023 / navy #0E355A, Proxima Nova, pill buttons/forms, eyebrow labels, red-dot heading accent).
- **Budget/timeline:** Stage 1 MVP in 9–12 months, lean team (business case: R36.9m / ~$2.05M Year 1).
- **Deployment:** multi-tenant SaaS + in-tenant option for regulated clients; Azure South Africa North primary region.
- **Reuse mandate:** Hulamin planning artifacts and patterns seed the RFx core (~70% requirement reuse) — do not reinvent.

## 10. Risks (top 5, from research)

1. Microsoft first-party agents commoditize light procurement AI → counter with domain depth + MCP interop.
2. Azure OpenAI model gaps in SA North vs POPIA s72 → model-routing abstraction + contractual cover.
3. AI evaluation challenged in tender disputes → explainability + human-in-the-loop + immutable overrides.
4. Enterprise sales cycles (9–18 mo) → Customer Zero internal pilot proves ROI while lighthouse deals mature.
5. Suite consolidation absorbs challenger partners → multi-source supplier-data strategy.

---

**Quality Gate — Product Owner (artifact_completeness):**
- [x] Problem statement clear and specific (quantified pain, named alternatives)
- [x] 4 personas with pain points, goals, current workflows
- [x] MVP scope: 10 must-have / 5 should-have / staged nice-to-have + explicit out-of-scope
- [x] 7 success metrics, each with number + timeframe
- [x] Error recovery, a11y (WCAG 2.1 AA), API-first, performance targets defined
- [x] No placeholders
- **Score: 96/100** ✅ (≥90 gate passed)

**Next:** Business Analyst agent → prd.md
