# Research Brief: IntelliSource

**Project:** IntelliSource — AI-Driven Sourcing & Contracting Platform
**Author:** BMad Research Agent
**Date:** 2026-07-24
**Status:** Complete
**Inputs:** IntelliSource Expanded Business Case v1 (Gijima), Gijima Architecture Design Principles (20), gijima-styles.css brand tokens, Hulamin Procurement Supplier Sourcing System planning artifacts, 27+ web sources (July 2026)

---

## 1. Executive Summary

IntelliSource enters a procurement-software market (~$8–10B, ~11% CAGR) at an inflection point: every legacy Source-to-Pay suite now ships AI copilots and agents (SAP Joule, Coupa Navi, GEP QUANTUM, Ivalua IVA Studio, Jaggaer JAI), so **"AI-powered" is no longer a differentiator by itself**. What remains structurally unsolved — and is IntelliSource's white space — is the combination of:

1. **Cost/complexity gap** — legacy suites cost six figures annually, take 6–18 months to deploy, and (Ariba) charge suppliers network fees. Mid-market and African enterprises are priced out.
2. **Microsoft-native orchestration** — no S2C system of record is Teams-native today. Chat approvals are commoditized (Zip, ORO), but deep domain workflow (committees, two-envelope evaluation, auctions, CLM) orchestrated inside Teams remains open. The window is narrowing as Microsoft's Copilot Agent Store and Dynamics 365 agentic ERP advance.
3. **South African localization moat** — automated B-BBEE 80/20 & 90/10 preference-point scoring, CSD/SARS/CIPC verification, staged compliance→functionality→price/preference evaluation, POPIA operator obligations, King V audit evidence, and readiness for the Public Procurement Act 28 of 2024 (draft regulations published April 2026, commencement pending). **No global suite does this out of the box.**

The Hulamin project supplies a proven, GO-rated (95.9/100) RFx execution foundation: 99 functional requirements, a battle-tested RfxStatus state machine, supplier portal, change-request workflow, immutable audit framework, and 55 implementation-ready stories — of which roughly 70% lift directly into IntelliSource's MVP, letting the new build concentrate on the net-new AI layer (intake, discovery, evaluation, Teams orchestration, contracting).

**Recommendation: GO to planning.** Position as "Autonomous Procurement Orchestrator, Microsoft-native, Africa-ready." Copy the challenger feature set (Zip/Levelpath/Keelvar/Arkestro patterns), not the legacy suite feature set.

---

## 2. Research Questions & Answers

| # | Question | Answer (evidence in sections below) |
|---|----------|-------------------------------------|
| RQ1 | What AI capabilities have incumbents shipped, and where are the gaps? | All 5 suites shipped agentic AI 2025–26 (§3). Gaps: cost, deployment time, supplier fees, mid-market UX, Africa compliance (§3, §7). |
| RQ2 | What do AI-native challengers offer worth extracting? | Conversational intake, autonomous tactical sourcing, ML-timed close, predictive bids, savings ledger, mobile-first supplier UX (§4, §5). |
| RQ3 | Is "Teams-native" defensible in 2026? | As a surface, no; as system-of-record + Agent Store distribution + MCP/A2A interop + domain depth, yes (§6). |
| RQ4 | What SA/Africa compliance features are mandatory? | POPIA operator duties + s72 transfer rules, B-BBEE PPPFA 80/20–90/10 scoring, CSD/eTenders integration, King V audit evidence, PPA-ready rule packs (§7). |
| RQ5 | What technology stack best satisfies Gijima's 20 architecture principles? | .NET 10/EF Core 10 + Postgres + AKS (validated by Hulamin); Microsoft Agent Framework + Azure AI Foundry for the AI layer; OpenAPI 3.2; event-sourced audit (§8). |

---

## 3. Competitor Comparison Table — Legacy Suites (July 2026)

| Vendor | Model | AI State (2026) | Strengths | Weaknesses | Threat to IntelliSource |
|--------|-------|-----------------|-----------|------------|------------------------|
| **SAP Ariba** | Enterprise S2P suite + supplier network | Joule agents GA/rolling: Bid Analysis Agent (GA Q1'26, total-cost bid comparison + trade-off narratives), Sourcing Assistant (RFP drafting→negotiation strategy), Category Mgmt Assistant, intake/contract agents planned; "autonomous spend management" vision (May 2026) | Deep SAP ERP integration; largest supplier network | 12–18 mo rollouts; ~$250k+/yr entry; ~20h training/user; unintuitive UX; **supplier-paid network fees** (annual sub + ~0.155% transaction fee above thresholds) | HIGH where client is SAP-first (ERP lock-in); weak in mid-market/Africa |
| **Coupa** (Thoma Bravo) | BSM/S2P suite, $10T community spend data | Navi multi-agent platform: Bid Evaluation Agent (Oct'25), Cost Formula Agent (75% faster, Nov'25), Agent Studio no-code (Dec'25), Compose & Catalyst (Jun'26). Acquired **Cirtuo, Scoutbee (discovery), Rossum (doc AI), Tonkean (NL intake & orchestration, May'26)** | Best UX of suites (G2 4.7); community benchmarking data; aggressive agentic M&A | 6–12 mo implementations needing consultants; per-user enterprise pricing; risk config "almost impossible" without experts | HIGH globally; MEDIUM in Africa (no local compliance depth) |
| **GEP (SMART/QUANTUM)** | Unified S2P + services | GEP QUANTUM AI-native layer (100+ customers); 2026 "Quantum Intelligence" autonomous agents; Gartner S2P Leader 2025 & 2026 | Strongest "AI-native" narrative; single data model | Services-heavy delivery; opaque pricing; Fortune-500 focus, limited mid-market/Africa presence | HIGH on narrative (closest AI-first story) |
| **Ivalua** (KKR) | Unified S2P platform | **IVA Studio (Jun 2026)**: fully agentic S2P execution, skills framework, **MCP support**, 25+ use cases; governance pattern: *agents inherit user permissions, every action logged* | Single codebase; extreme configurability; best AI governance pattern (worth copying) | Implementation complexity driven by configurability; high TCO | MEDIUM — enterprise-heavy, not Microsoft-focused |
| **Jaggaer** (Vista) | S2P suite, strong supplier risk/ESG | JAI (launched Jun'25, full launch May 2026): Assist → Copilot → Autopilot no-code agentic platform on "Agent OS" | Supplier risk & ESG modules; faster mid-market time-to-value than Ivalua | Complex navigation; dated UX; performance issues on large datasets | LOW–MEDIUM in Africa |

**Pricing signal across suites:** six-figure annual entry, per-user/module licensing, 6–18 month deployments, supplier-side fees (Ariba). This is precisely the gap the business case targets with $8k/mo mid-market and $18k/mo enterprise pricing.

## 3b. Challenger Comparison Table — AI-Natives (feature blueprint)

| Vendor | Category | Signature capabilities worth extracting | Proof points |
|--------|----------|------------------------------------------|--------------|
| **Zip** ($2.2B val.) | Intake orchestration | Conversational front door for all spend; Slack/Teams approvals; cross-functional routing; AI "Superagents" (unblock stalled requests, tail-spend negotiation); procurement-native **MCP**; governed AI platform | $6B cumulative customer savings (Dec'25); 7M+ suppliers |
| **Oro Labs** (~$100M C) | Intake + orchestration | Guided adaptive intake; approvals in Teams/Slack/GChat; supplier onboarding w/ bank-detail validation | — |
| **Levelpath** ($55M B) | AI-native sourcing | Hyperbridge multi-model reasoning; genuinely **mobile-first** UX; invoice automation to capture negotiated savings | "10x efficiency" claim |
| **Fairmarkit** | Autonomous sourcing | "Total Agentic Sourcing" (Apr'26): agents autonomously source tail AND strategic spend; KIT assistant; ERP-native integrations | 10x events/FTE; ~$40k savings/buyer |
| **Keelvar** | Sourcing optimization | Kai orchestrator; **Optimal Close Agent** (ML picks best bidding close time); **Autonomous Rate Refresh** (auto re-market on contract expiry/drift); no-code sourcing bots | Only vendor in both Gartner autonomous-sourcing categories (2026) |
| **Arkestro** | Predictive procurement | ML-predicted prices; **suggested/pre-populated bids** and intelligent counter-offers embedded in supplier workflow | 18.8% savings per $1M; up to 60% cycle-time reduction |
| **Globality** | Autonomous negotiation (services) | Glo: conversational scoping replaces RFP; autonomous multi-round time-boxed negotiations | "$15M saved in one hour" case |
| **mysupply** | SAP-attached autonomous sourcing | Demand bundling for leverage; AI bots + eAuctions + game theory; audit-proof | >50% effort reduction; 5–11% savings |

**Consolidation warning:** Coupa absorbed four AI-natives in ~18 months. Everest Group (Mar 2026) sees the market rationalizing around a few anchors — validation for a differentiated regional/Microsoft-native anchor play, but the acquisition clock is running.

---

## 4. Feature Capability Matrix (market scan → IntelliSource backlog candidates)

Legend: ✓ = table stakes (all suites have it) · ★ = differentiator worth building natively · SA = South Africa moat feature

| Lifecycle phase | Feature | Market status | IntelliSource |
|---|---|---|---|
| **Intake** | Plain-language conversational intake → structured spec | Tonkean/Zip lead; suites partial | ★ MVP core |
| | Guided adaptive intake forms; policy-aware routing | Zip/ORO | ★ MVP |
| | Demand bundling of similar requests | mysupply | Stage 2 |
| | Stalled-request unblocking agent | Zip Superagent | Stage 3 |
| **Supplier discovery** | Approved-vendor lookup (ERP master) | ✓ all | MVP (Hulamin pattern) |
| | AI web/DB discovery + enrichment | Scoutbee (now Coupa) | ★ Stage 2 |
| | ESG/diversity data (EcoVadis connector), sanctions screening | Suites via add-on | Stage 2 |
| | CSD/SARS/CIPC verification, B-BBEE certificate/affidavit capture | **Nobody** | ★ SA MVP–Stage 2 |
| **RFx authoring** | AI-drafted RFQ/RFP/RFI from spec + template libraries | Emerging in all | ★ MVP core |
| | Event types RFI/RFQ/RFP, deadlines, reminders, Q&A windows | ✓ all | MVP (Hulamin reuse) |
| | Multi-round / BAFO; two-envelope (technical→price) staged evaluation | ✓ suites | Stage 2 (envelope: MVP data model) |
| | Auction engine (English/Dutch/Japanese, multi-attribute) | ✓ suites; Keelvar optimizes | Stage 3 |
| | ML-timed event close; autonomous rate refresh | Keelvar only | Stage 3 |
| **Evaluation** | Weighted criteria scorecards | ✓ all | MVP |
| | AI completeness/compliance check (missing docs, certs) | Partial everywhere | ★ MVP |
| | AI bid comparison w/ total-cost normalization + exec summaries | Joule/Navi shipping | ★ MVP (basic) → Stage 2 |
| | Committee workflows: independent/blind scoring, consensus, CoI declarations, e-voting | ◐ all (weak) | ★ Stage 2 — white space |
| | B-BBEE 80/20 & 90/10 price+preference calculation | **Nobody** | ★ SA Stage 2 |
| **Award & contract** | Award-to-contract flow, clause libraries, AI redlining vs playbooks | CLM specialists (Sirion, Icertis) | Stage 3 |
| | eSignature (DocuSign/Adobe) | ✓ all | Stage 3 |
| | Contract-expiry-triggered re-sourcing | Keelvar/IVA | Stage 3 |
| **Collaboration** | Teams-native approvals, committee meetings auto-scheduled, e-voting in Teams | **Nobody at S2C depth** | ★ MVP core (wedge) |
| **Analytics** | Cycle-time/SLA KPIs, exec dashboards, CSV/PDF export | ✓ all | MVP |
| | Savings ledger (event→contract), leakage tracking | Zip/Levelpath | Stage 2 |
| | Predictive spend/risk analytics | Suites | Stage 3 |
| **Supplier portal** | Free, no-fee access (anti-Ariba); single front door; mobile-first bidding; reusable profiles | HICX: suppliers juggle 8.4 portals avg; 61% can't do best work | ★ MVP |
| **Audit** | Immutable audit trail, evidence export | ✓ all | MVP (Hulamin framework + hash chaining) |

---

## 5. Hulamin Reuse Inventory (seed assets)

The Hulamin Procurement Supplier Sourcing System (GO at 95.9/100, March 2026) provides directly transferable assets:

**Lift-and-adapt (≈70% of its scope):**
- Clean Architecture .NET scaffolding, EF Core + PostgreSQL, RFC 7807 error middleware, Azure Blob storage, OpenAPI/Swagger, Docker Compose (EPIC-01)
- RFx core lifecycle: create/edit/clone/delete, status enforcement, file validation + virus scanning (EPIC-02); state machine `Draft → PendingReview → PendingApproval → Published → Closed` (+ Rejected, Returned-to-Initiator, Pending-Clarification; auto-approval when Reviewer=Approver; RFQ short path skipping approval)
- Review/approval workflow with mandatory comments on Reject/Clarify and SoD (EPIC-03)
- Publishing & invitations with tokenized portal links, retry tracking (EPIC-04)
- Supplier portal: email/password + first-time setup, lockout (5 attempts/30 min), acknowledgement-gates-documents, versioned response submission, deadline locking (EPIC-05)
- Change-request engine with 7 CR types, dynamic forms, CR numbering (EPIC-06)
- Dashboard + SignalR real-time, notification engine with 7-day/1-day reminders and retry (EPIC-07/08)
- Immutable AuditLog framework (append-only, OldValue/NewValue JSON, 7-year POPIA retention, status history derived from audit) — ADR-012
- Numbering schemes: `RFx-YYYY-NNN`, `CR-YYYY-NNN`, `ERR-YYYYMMDD-NNNNN`
- NFR baselines: API p95 <500ms, dashboard <2s, lockout/session policies, AES-256 at rest, TLS 1.2+, data residency Azure SA

**Net-new for IntelliSource (Hulamin explicitly out-of-scope):** AI intake/spec generation, AI RFx drafting, supplier discovery, bid evaluation & scoring (only API scaffolding exists), award/contract lifecycle, Teams orchestration, supplier onboarding/KYC.

**Lessons to fix from day one:** (1) tiered rate limiting (supplier upload spikes at deadline — add ~50 req/min upload tier); (2) DR targets RTO 1h / RPO 15 min; (3) WCAG accessibility was deferred in Hulamin — IntelliSource enables WCAG 2.1 AA (target 2.2 AA) from the start; (4) reconcile requirement counts — summary metrics must match enumerated items; (5) multi-approver chains unsupported — IntelliSource needs configurable approval chains.

---

## 6. Microsoft-Native Strategy Assessment

**Current landscape:** Zip and ORO offer Teams/Slack *integrations* (chat approvals, notifications), but no S2C system of record is Teams-native. Microsoft's own motion: M365 Copilot **Agent Store** (in-product marketplace, 70+ agents at launch), Copilot Studio agents + workflows, and Dynamics 365 "agentic ERP" with Copilot Cowork — whose published procurement scenario already covers gathering supplier email responses, comparing bids, generating scorecards, and coordinating approvals.

**Defensibility verdict:** Teams-native is a **wedge, not a moat**. Defensible combination:
1. True S2C system of record with domain depth Microsoft won't build (evaluation committees, two-envelope compliance, B-BBEE scoring, auction engines, CLM)
2. Distribution via Agent Store/AppSource with Teams as the orchestration surface
3. **Microsoft Agent Framework + MCP + A2A alignment** so IntelliSource agents interoperate with customers' Copilot estates instead of competing
4. Azure South Africa data residency

**Risk:** Icertis already chains across SAP + Microsoft Copilot in CLM; the Microsoft-procurement lane is open but narrowing. Speed matters.

---

## 7. South Africa / Africa Compliance Requirements (moat features)

**POPIA (operator role):** IntelliSource processes personal information on behalf of customer "responsible parties" → mandatory written DPA (s21), processing only on documented instruction, security safeguards, immediate breach notification to the responsible party. Eight lawful-processing conditions drive features: processing registers, retention schedules, data-subject access/correction/deletion tooling. Penalties: fines to R10M + criminal liability. **Section 72 cross-border transfer rules directly constrain LLM inference routing** — any AI calls leaving SA need adequacy/consent/contract cover; prefer Azure OpenAI in SA North; paper any cross-region inference under s72.

**King IV → King V:** IoDSA adopted King V on 31 Oct 2025 (effective FYs starting ≥1 Jan 2026), retaining apply-and-explain with sharpened technology/information governance. IntelliSource's immutable audit trail + decision logs = board-grade "King V evidence" for procurement governance and combined assurance. Sales collateral, not just compliance.

**B-BBEE / PPPFA preference scoring:** tenders >R30k must apply **80/20 (≤R50M)** or **90/10 (>R50M)** price/B-BBEE-points formulas; Level 1 contributors earn full preference points; evaluation is staged: mandatory-document compliance → functionality threshold → price + preference calculation. Bidders prove status via SANAS-accredited certificates or sworn affidavits (EMEs/QSEs). 2022 regulations allow organs of state to define specific-goal allocations. **No global suite automates this.**

**Public Procurement Act 28 of 2024:** assented 18 Jul 2024, not yet in force; National Treasury published draft General Public Procurement Regulations for comment 16 Apr 2026; PPPFA + 2022 regs apply meanwhile. Public-sector readiness = CSD integration (mandatory since 2016; SARS tax-status + CIPC verification), eTenders portal publication, bid evaluation/adjudication committee separation, PFMA/MFMA-grade audit trails. **Build configurable compliance rule packs with a PPA-ready switch.**

**Data residency:** Azure South Africa North (Johannesburg) has 3 availability zones, paired with SA West; Microsoft investing a further R5.4bn through 2027. Verify Azure OpenAI/Foundry model availability in SA North per model; route around gaps with s72-compliant contracts.

---

## 8. Technology Stack Options

Gijima's 20 Architecture Design Principles lock the core stack (validated end-to-end by Hulamin):

| Layer | Locked/Recommended | Rationale & 2026 status |
|---|---|---|
| Backend | **.NET 10 LTS, Clean Architecture** | Principle #1; .NET 10 LTS since Nov 2025; EF Core 10 query pipeline 25–50% faster |
| Frontend | **ASP.NET MVC + React + Tailwind** | Principle #2; Gijima brand tokens map to Tailwind config |
| Data | **EF Core 10 → PostgreSQL** | Principle #3; Npgsql batched inserts; proven in Hulamin |
| Local dev | **Docker Desktop** | Principle #4 |
| Deployment | **AKS (Kubernetes), cloud-native containers** | Principle #5; namespace-per-tenant logical isolation + **deployment stamps** with per-tenant Postgres for regulated/public-sector tenants (K8s not safe for hostile multi-tenancy) |
| AI layer | **Microsoft Agent Framework** (SK+AutoGen successor; GA Q1'26, deterministic Workflow framework GA Q2'26) + **Azure AI Foundry / Azure OpenAI** | MCP, A2A, OpenAPI-first interop; aligns with Teams/Copilot strategy; deterministic workflows with compliance audit trails |
| RAG | Azure AI Search **hybrid retrieval** (keyword+vector+semantic rerank), 1.5–2k-token parent chunks | Pure vector misses part codes/IDs; model tiering (frontier for evaluation, mini for volume) cuts AI cost 40–60% |
| API | **OpenAPI 3.2** (released Sep 2025) + Swagger | Principle #7 (OAS 3.2.0); streaming/SSE support for agent endpoints; expose agent tools via MCP |
| AuthN/Z | **Entra ID SSO + MFA**, supplier email/password + optional Entra External ID | Principle #9; Zero Trust (#6) |
| Audit | **Event-sourced append-only log + cryptographic hash chaining**, WORM export | Principles #10, #20; King V/PPA evidence grade; copy Ivalua pattern: *agents inherit invoking user's permissions; every agent action logged* |
| Observability | OpenTelemetry + Application Insights | Principles #16–19 (99.5% app / 99.99% infra uptime) |

**Alternatives considered:** GraphQL (rejected — principle #7 mandates OAS/REST; OpenAPI 3.2 + webhooks suffice); Azure SQL (rejected — principle #3 mandates Postgres); LangChain/LlamaIndex (rejected — Microsoft Agent Framework aligns with Teams/Copilot strategy and .NET).

---

## 9. Best Practice Patterns

1. **Agent governance (Ivalua pattern):** AI agents execute strictly within the invoking user's permissions; never exceed; log every agent action to the audit trail with model version + prompt hash. Human-in-the-loop approval for all award-affecting outputs.
2. **AI transparency for tender defensibility:** every AI evaluation output carries rationale, source citations to bid documents, and a confidence flag; human evaluators must confirm/override with reasons — the audit trail records both. (Public-sector tender challenges demand this.)
3. **Two-envelope discipline in data model from day one:** commercial data sealed/encrypted separately from technical responses; unsealing is an audited, permissioned event after functionality gates pass.
4. **Event-sourced audit:** append-only, intent-capturing events ("user X approved award Y for reason Z"), hash-chained for tamper evidence, WORM-exportable for auditors.
5. **Multi-tenant isolation tiers:** shared-namespace for standard SaaS tenants; deployment-stamp with dedicated Postgres for regulated/SOE tenants ("in-tenant" business-case option).
6. **Supplier-first portal UX:** zero supplier fees; acknowledgement-gated document access (Hulamin); mobile-first submission; suppliers see only invited events; no email enumeration.
7. **Model tiering & data boundaries:** frontier model for bid evaluation summaries; mini models for classification/reminders; no customer bid data used for model training; s72-compliant inference routing.
8. **Performance discipline:** p95 API <500ms, LCP <2.5s, INP <200ms, initial bundle <1MB — instrument from sprint 1 (most B2B fails these; passing is a demo-able differentiator).

---

## 10. Benchmarks (targets to match or beat)

| Metric | Market claims (vendor-reported) | IntelliSource target |
|---|---|---|
| Sourcing cycle-time reduction | Arkestro ≤60%; Coupa/Tonkean 50%; business case 30–40% | **≥30% instrumented, provable** (cycle-time analytics built in) |
| Manual-effort reduction | mysupply >50%; Zip 30+ h/wk | ≥50% on tactical events |
| Adoption lift from NL intake | Tonkean 2.2x | Track intake→event conversion |
| API latency | Suites unpublished | **p95 <500ms; median <100ms** |
| Page performance | Avg B2B mobile LCP 7.05s (poor) | **LCP <2.5s, INP <200ms, CLS <0.1** |
| Concurrency | — | **10k+ concurrent users, <2s response** (Gijima principle #13) |
| Availability | 99.95% typical B2B | **99.5% app / 99.99% infra** (principles #18–19) |
| Accessibility | EAA deadline passed Jun 2025 (EN 301 549/WCAG 2.1 AA); almost no procurement vendor publishes ACR | **WCAG 2.1 AA (aim 2.2 AA) + published ACR** |

---

## 11. Key Findings & Recommendations

1. **Don't sell "AI"; sell speed-to-value + zero supplier fees + Africa compliance.** All incumbents have AI stories; none have 4–8-week deployments at mid-market pricing with B-BBEE/POPIA/King V built in.
2. **MVP = Hulamin spine + AI layer + Teams surface.** Reuse ≈70% of Hulamin's proven requirements; concentrate new engineering on intake AI, RFx drafting AI, evaluation AI (completeness + weighted scoring + exec summaries), and Teams orchestration.
3. **Build the SA compliance rule pack early (Stage 2 at latest)** — it is the hardest-to-copy moat and unlocks SOE/public-sector lighthouse deals (Eskom, Transnet targets in business case).
4. **Align to Microsoft Agent Framework + MCP now** — distribution through Agent Store and interop with customer Copilot estates converts Microsoft from potential competitor to channel.
5. **Two-envelope + committee governance in the MVP data model** even if UI ships Stage 2 — retrofitting sealed-bid separation is expensive.
6. **Instrument the ROI story** — cycle-time and savings ledgers from sprint 1; every marketing claim (≥30% cycle reduction) must be provable in-product (Customer Zero: Gijima Procurement BU).
7. **Watch consolidation:** Coupa bought 4 AI-natives in 18 months. Remaining independents are feature blueprints and comps; a differentiated regional anchor play beats a me-too generalist.

## 12. Risks & Constraints

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Microsoft first-party agents (Copilot Cowork) commoditize light bid comparison | High | Medium | Domain depth (committees, envelopes, B-BBEE); MCP interop rather than competition |
| Azure OpenAI model availability gaps in SA North | Medium | High (POPIA s72) | Verify per model; s72 contractual cover for cross-region; abstraction layer for model routing |
| Incumbent ERP lock-in (Ariba on SAP clients) | High | Medium | Overlay positioning: integrate, don't replace (business-case hybrid strategy) |
| AI evaluation outputs challenged in tender disputes | Medium | High | Human-in-the-loop, rationale + citations, immutable audit of overrides |
| PPA commencement timing uncertainty | Medium | Low | Configurable rule packs; PPPFA default, PPA switch |
| 9–18 month enterprise sales cycles strain runway | High | Medium | Customer Zero (Gijima internal) + lighthouse SOE pilots (business case strategy) |
| Coupa/suite acquisition of remaining challengers narrows partner options (e.g., supplier-data feeds) | Medium | Low | Multi-source data strategy (EcoVadis, D&B, CSD) |

---

## Sources

Key sources (full URLs in agent research log): SAP News & ERP Today (Joule agents, May 2026), Coupa newsroom (Navi, Agent Studio, Tonkean/Scoutbee/Rossum acquisitions), GEP QUANTUM/QI, Ivalua IVA Studio PR (Jun 2026), Jaggaer JAI (Businesswire May 2026), Zip Series D & Superagents (Jun 2026), Keelvar Gartner Market Guide 2026, Arkestro, Globality, mysupply SAP Store, Everest Group consolidation analysis (Mar 2026), HICX supplier experience survey, Microsoft Agent Framework/Learn, Azure regions/TechCentral (SA investment), OpenAPI Initiative (3.2), POPIA s21/s72 (Michalsons, Securiti), IoDSA King V Code (Oct 2025), eTender Portal & ProTenders (PPPFA 80/20–90/10), CDH & SmartProcurement (Public Procurement Act 2024, draft regs Apr 2026), Level Access (EAA), BlazingCDN/Parachute (performance benchmarks).

---

**Quality Gate — Research:**
- [x] All 5 research questions answered with evidence
- [x] Competitor table: 5 legacy + 8 challengers (13 entries)
- [x] Technology recommendations justified against Gijima's 20 principles
- [x] Architecture-focused; quantitative where available

**Next:** Product Owner agent → product-brief.md
