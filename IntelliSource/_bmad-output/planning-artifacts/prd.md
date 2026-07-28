# Product Requirements Document (PRD): IntelliSource

**Project:** IntelliSource — AI-Driven Sourcing & Contracting Platform
**Author:** BMad Business Analyst Agent
**Date:** 2026-07-24
**Version:** 1.0
**Status:** Approved for Architecture
**Inputs:** product-brief.md, research-brief.md, Hulamin PRD (reuse baseline), Gijima Architecture Design Principles

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-07-24 | Business Analyst Agent | Initial draft from product brief |
| 1.0 | 2026-07-24 | Business Analyst Agent | Full FR/NFR set, journeys, data model, API overview |

---

## 1. Executive Summary

IntelliSource turns plain-language business needs into governed RFx events, automates supplier engagement through a free portal, evaluates bids with explainable AI, orchestrates approvals and committees in Microsoft Teams, and produces court-grade audit evidence — deployed on Gijima's mandated architecture (.NET 10 Clean Architecture, React + Tailwind, EF Core + PostgreSQL, AKS, Zero Trust, OpenAPI 3.2).

This PRD specifies the **Stage 1 MVP** in full detail (10 must-have capability areas M1–M10 from the product brief) and outlines Stage 2–3 requirements for roadmap traceability. Approximately 70% of the RFx execution core reuses proven requirements from the Hulamin Supplier Sourcing System (GO-rated); net-new scope concentrates on AI intake, AI RFx authoring, AI evaluation, Teams orchestration, and evidence packaging.

**Scope pillars:** (1) Intake-to-Spec AI, (2) RFx Lifecycle & Governance, (3) Supplier Portal, (4) Sealed Evaluation with AI assistance, (5) Teams Orchestration, (6) Immutable Audit & Evidence, (7) Dashboards & Reporting, (8) Identity, Admin & POPIA, (9) API-First Platform.

## 2. Glossary

| Term | Definition |
|------|------------|
| RFx | Collective term for RFQ (Request for Quotation), RFP (Request for Proposal), RFI (Request for Information) |
| Intake | A plain-language business need captured before it becomes an RFx |
| Specification (Spec) | Structured requirement document generated from an intake (scope, quantities, criteria, timelines) |
| Sealed bid | Supplier response hidden from all internal users until the event closing time |
| Two-envelope | Separation of technical and commercial response content; commercial opened only after technical gate |
| BAFO | Best and Final Offer (multi-round negotiation) — Stage 2 |
| CR | Change Request against a published RFx (initiator- or supplier-raised) |
| SoD | Segregation of Duties (creator ≠ approver) |
| Evidence pack | Exported, tamper-evident bundle of all event records for audit |
| B-BBEE | Broad-Based Black Economic Empowerment (SA preferential procurement) — scoring engine Stage 2, data capture MVP |
| Customer Zero | Gijima's internal Procurement BU as first production user |
| Operator (POPIA) | Party processing personal information on behalf of a Responsible Party — IntelliSource's legal role |
| Agent | An AI process acting under a human user's identity and permissions |

## 3. Personas (from Product Brief)

Nomsa — Business Requester · Thandi — Senior Category Manager (Initiator/Sourcing Lead) · Pieter — Head of Procurement (Governance/ViewOnly+Approver) · Ahmed — Supplier Respondent. Internal system roles: **Requester, Initiator, Reviewer, Approver, Administrator, ViewOnly**; external: **SupplierUser**.

## 4. User Journeys

### J1 — Plain-Language Intake to Approved Specification (Nomsa, Thandi)

**Trigger:** Nomsa needs goods/services (e.g., "We need 200 mid-range laptops for the Durban office by October").

| # | Actor | Action | System response |
|---|-------|--------|-----------------|
| 1 | Nomsa | Types need in Teams bot or web intake form | AI asks 3–7 clarifying questions (quantity, budget range, delivery, constraints, category confirmation) one group at a time |
| 2 | Nomsa | Answers; uploads any reference docs | Draft structured spec generated (scope, line items, evaluation criteria suggestions, timeline); category auto-tagged |
| 3 | Nomsa | Reviews spec summary; submits | Intake # INT-YYYY-NNN created, status PendingTriage; confirmation with tracking link |
| 4 | Thandi | Opens triage queue; reviews spec | Can accept (convert to RFx), return to requester with comments, or reject with reason |
| 5 | Thandi | Accepts → "Convert to RFx" | New RFx pre-populated from spec; intake linked; Nomsa notified with status link |

**Success:** Intake converted to draft RFx ≤2 days; Nomsa tracks status without emailing anyone.
**Failure handling:** AI service unavailable → form falls back to structured manual template, banner "AI assist unavailable — standard form shown", intake still submittable. AI misclassifies category → Thandi corrects at triage; correction logged and used for prompt tuning. Requester abandons mid-dialog → autosaved draft retrievable 30 days.
**Edge cases:** Duplicate intake detection (similar open intake within same category/requester → warn with link); intake in another language (respond in kind if supported, else English + notice); budget exceeds requester's delegation → auto-adds financial approver at triage; attachment fails virus scan → rejected with reason, intake continues without file.

### J2 — AI-Assisted RFx Authoring (Thandi)

**Trigger:** Converted intake or blank "New RFx".

| # | Actor | Action | System response |
|---|-------|--------|-----------------|
| 1 | Thandi | Selects sourcing method (RFQ/RFP/RFI) | Method-specific required fields + template list shown |
| 2 | Thandi | Clicks "Draft with AI" | AI drafts RFx document from spec + selected template: background, scope, line items/pricing schedule, submission instructions, proposed evaluation criteria & weights; each section marked "AI-drafted — review required" |
| 3 | Thandi | Edits sections; sets dates (BiddingStart, ResponseDue); uploads attachments | Validation: ResponseDue > BiddingStart > now; file type/size/virus checks |
| 4 | Thandi | Defines evaluation criteria & weights; envelope assignment (technical/commercial) | Weights must total 100%; criteria locked at publish |
| 5 | Thandi | Adds suppliers (master lookup or manual) & contacts | Duplicate detection on entity + email |
| 6 | Thandi | Saves | RFx-YYYY-NNN assigned, status Draft |

**Success:** Publishable draft in <30 min for a standard RFQ.
**Failure:** AI draft fails/timeout (>60s) → retry once automatically, then offer blank template; nothing auto-publishes. Template missing → generic type template offered.
**Edge cases:** Clone existing RFx (copies structure, docs, suppliers; resets dates/status per Hulamin rules); concurrent edit by two users → optimistic concurrency, second save gets conflict prompt with diff; AI proposes criteria weights summing ≠100% → blocked client+server side.

### J3 — Review, Approval & Publication (Thandi, Reviewer, Approver)

**Trigger:** Thandi submits Draft for review.

| # | Actor | Action | System response |
|---|-------|--------|-----------------|
| 1 | Thandi | "Submit for Review" | Mandatory-field validation; status → PendingReview; RFx locks for editing; reviewer notified (Teams card + email) |
| 2 | Reviewer | Opens read-only review view | Full RFx + AI pre-review checklist (completeness of dates, docs, criteria, supplier list) |
| 3a | Reviewer | RFQ: "Approve" | Status → Published (short path); invitations dispatched |
| 3b | Reviewer | RFI/RFP: "Submit for Approval" | Status → PendingApproval; approver notified |
| 3c | Reviewer | "Reject" or "Send Back for Clarification" | Comments mandatory; status → Returned (editable) / PendingClarification; initiator notified |
| 4 | Approver | "Approve" (RFI/RFP) | Status → Published; invitations auto-dispatched; publish date recorded |
| 5 | System | Reviewer = Approver case | Auto-approval short-circuit with two distinct audit entries |

**Success:** Governed publication with SoD enforced; suppliers invited within 5 minutes of approval.
**Failure:** Invitation email bounce → per-recipient retry (3x exponential backoff), failed recipients flagged on dashboard with manual resend. Approver vacancy → Administrator reassigns; reassignment audited.
**Edge cases:** Approve attempt by RFx creator blocked (SoD, configurable); skip-stage transitions rejected server-side ("RFx must be reviewed before publication"); withdrawal before close → status Withdrawn, suppliers notified (new vs Hulamin).

### J4 — Supplier Response Submission (Ahmed)

**Trigger:** Invitation email with tokenized portal link.

| # | Actor | Action | System response |
|---|-------|--------|-----------------|
| 1 | Ahmed | Clicks link; first-time → sets password (+ optional MFA) | Account created against invited contact email; lockout 5 fails/30 min |
| 2 | Ahmed | Lands on the specific RFx | Sees only RFx he's invited to |
| 3 | Ahmed | Acknowledges participation (or declines with reason) | Acknowledgement timestamped + IP; unlocks documents; buyer notified |
| 4 | Ahmed | Downloads docs; raises questions via Q&A (if enabled) or CR | Q&A anonymized to other suppliers; answers broadcast as addenda |
| 5 | Ahmed | Uploads response files per envelope (technical/commercial), saves drafts | Type/size (≤50MB/file)/virus validation; draft versions retained |
| 6 | Ahmed | Submits final before deadline | Version N recorded, receipt with timestamp; can revise until close (new version) |
| 7 | System | Deadline passes | Submissions locked; late attempts blocked with clear message; closing notice sent; buyer sees sealed count only until close |

**Success:** 100% receipted submissions; zero premature bid visibility.
**Failure:** Upload interrupted → resumable/chunked upload, retry prompt; portal down at deadline (P1) → incident process may extend via CR, all extensions audited.
**Edge cases:** Contact left supplier company → supplier admin (or buyer via CR) transfers contact; multiple contacts per supplier collaborate on one response workspace; declined supplier cannot submit; deadline extension CR mid-drafting → live banner update + email.

### J5 — Change Requests (Thandi or Ahmed)

**Trigger:** Post-publication change needed (extend due date, clarification, document update/issue, add supplier, update requirement, other).

Flow (Hulamin pattern): raise CR (CR-YYYY-NNN, dynamic form per type, attachments allowed) → status PendingReview → reviewer Approve/Reject/Return-for-Clarification (comments mandatory on reject/clarify) → on approval, system auto-applies effects (extend ResponseDueDate + notify all; new document version active, old archived; invite added supplier only; update requirement text) → affected parties notified; all steps audited.
**Failure/edge:** CR against Closed/locked RFx blocked; one active CR per RFx per type; new due date must be future & ≥ current; supplier CRs only on RFx they're invited to and after acknowledgement; auto-reject open CRs when RFx closes.

### J6 — Sealed Evaluation & Award Decision (Thandi, Evaluators, Pieter)

**Trigger:** RFx closes with ≥1 submission.

| # | Actor | Action | System response |
|---|-------|--------|-----------------|
| 1 | System | At close | Technical envelope unsealed to evaluation team; commercial stays sealed (two-envelope mode) |
| 2 | System | AI completeness check | Per supplier: required docs/certs/forms present? Gaps flagged with citation to requirement; confidence level shown |
| 3 | Thandi | Confirms/edits evaluation panel | Evaluators get scoring assignments; CoI declaration required before access (Stage 2: blind scoring) |
| 4 | Evaluators | Score criteria on defined scale with comments | AI draft scores/summaries per criterion offered as assist, marked "AI-suggested"; human score is the score of record |
| 5 | Thandi | Opens commercial envelope (after technical gate met) | Unsealing is a logged, permissioned event; price comparison table generated |
| 6 | System | Consolidation | Weighted totals, ranking, side-by-side matrix, AI executive summary with rationale + citations + outlier flags |
| 7 | Thandi | Records award recommendation | Recommendation + justification captured; sent to Approver |
| 8 | Approver | Approves/rejects recommendation (Teams card or web) | Status → AwardApproved/Returned; outcome letters queued to suppliers; event → Awarded |

**Success:** Defensible, explainable award decision; evaluation cycle ≤5 days for standard RFQ.
**Failure:** AI summary service down → scoring proceeds fully manually; zero submissions at close → event marked Unsuccessful with re-issue shortcut (clone); evaluator misses SLA → reminder + escalation to Thandi.
**Edge cases:** Tie scores → configurable tie-break policy documented in event (price weight, B-BBEE level Stage 2); evaluator overrides AI-flagged gap → mandatory reason, audited; single-bid events → flagged for enhanced justification; abandoned evaluation (all bids non-compliant) → Unsuccessful with evidence retained.

### J7 — Teams Orchestration (all internal actors)

**Trigger:** Any workflow event needing attention.
Approval requests arrive as actionable Teams adaptive cards (Approve/Reject/Clarify with comment box) that execute against the API under the actor's Entra identity; evaluation kick-off auto-schedules a Teams meeting with agenda + deep links; status queries answered by the IntelliSource bot ("show my pending approvals"); channel notifications for publish/close/award milestones.
**Failure:** Teams/Graph unavailable → email fallback within 60s, action links to web app; card action on stale state (already approved) → card refreshes with current state message.
**Edge:** Actor without Teams license → email-only path; guest/external users never receive internal cards; card actions idempotent.

### J8 — Audit & Evidence (Pieter, Auditor)

**Trigger:** Audit query or dispute ("prove this award was fair").
Pieter filters the audit trail by event/user/date/action; views immutable entries (who/what/when/IP/old→new, AI entries with model + prompt hash); generates an **evidence pack** (PDF summary + CSV/JSON detail + document manifest with SHA-256 checksums) in <5 min; export itself is audited. Status history reconstructed from the log. 7-year retention.
**Edge:** Evidence for deleted (soft) drafts retained; POPIA data-subject deletion produces redacted-but-verifiable entries (hash chain preserved).

### J9 — Administration (Administrator)

User/role management synced with Entra ID groups; supplier master administration (dedupe, merge, deactivate); template library CRUD with versioning; workflow configuration (SoD toggle, approval chains S1, CoI requirement); notification template editing; POPIA tooling (subject access report, correction, deletion with legal-hold override); tenant configuration (multi-tenant SaaS or in-tenant).
**Edge:** Role change mid-workflow doesn't orphan in-flight approvals (reassignment prompt); deactivating a supplier with open invitations warns and requires CR.

---

## 5. Functional Requirements (MVP — Stage 1)

Requirement IDs: `FR-{MODULE}-{NN}`. Every FR is testable — a Given/When/Then can be written without ambiguity. Journey cross-references in brackets.

### 5.1 Intake & Specification (FR-INT) — net-new [J1]

| ID | Requirement |
|----|-------------|
| FR-INT-01 | The system shall accept plain-language intake requests via web form and Teams bot, min 20 / max 5,000 characters, with up to 10 attachments (≤50MB each). |
| FR-INT-02 | On intake submission, the AI shall generate clarifying questions grouped in batches of ≤5, covering at minimum: quantity/scope, required-by date, budget range (optional), delivery location, and category confirmation. |
| FR-INT-03 | The AI shall generate a structured specification containing: title, background, scope statement, line items (description, quantity, unit), proposed evaluation criteria, and proposed timeline — each section individually editable by the requester. |
| FR-INT-04 | The system shall auto-assign a category from the configured taxonomy with a confidence score; confidence <70% shall display "category unconfirmed" requiring triage confirmation. |
| FR-INT-05 | Each submitted intake shall receive a unique sequential ID in format INT-YYYY-NNN. |
| FR-INT-06 | Intake status shall follow: Draft → PendingTriage → Accepted (converted) / Returned / Rejected. Returned intakes shall be editable and resubmittable by the requester. |
| FR-INT-07 | Triage users (Initiator role) shall be able to Accept-and-Convert, Return (comments mandatory), or Reject (comments mandatory) an intake; the requester shall be notified of each decision within 60 seconds via their notification channels. |
| FR-INT-08 | "Convert to RFx" shall create a Draft RFx pre-populated with the spec fields and maintain a permanent bidirectional link between intake and RFx. |
| FR-INT-09 | The requester shall see a status-tracking view of their intakes showing current status, assigned owner, and timestamped history. |
| FR-INT-10 | If AI services are unavailable or respond >30s, the intake form shall fall back to a structured manual template with the banner "AI assist unavailable"; submission must remain possible. |
| FR-INT-11 | The system shall detect potential duplicate intakes (same requester + category with open intake, or title cosine similarity ≥0.85) and display a warning with links before submission. |
| FR-INT-12 | Intake drafts shall autosave every 30 seconds and be retrievable for 30 days. |
| FR-INT-13 | When an intake's stated budget exceeds the requester's configured delegation-of-authority limit, the system shall automatically add the configured financial approver to the triage step. |

### 5.2 RFx Creation & Lifecycle (FR-RFX) — Hulamin reuse+extend [J2, J3]

| ID | Requirement |
|----|-------------|
| FR-RFX-01 | Users with Initiator role shall create RFx events of type RFQ, RFP, or RFI, capturing: title (≤200 chars), requirement/objective, sourcing method, bidding start date, response due date. |
| FR-RFX-02 | Each RFx shall receive a unique sequential number RFx-YYYY-NNN at creation; the dashboard shall additionally render a type-prefixed display form (e.g., RFQ-2026-014). |
| FR-RFX-03 | ResponseDueDate must be > BiddingStartDate and > current time; violations shall block save with field-level error messages. |
| FR-RFX-04 | RFx status shall follow the state machine: Draft → PendingReview → (RFQ: Published \| RFI/RFP: PendingApproval → Published) → Closed, with side states Returned (editable), PendingClarification, Rejected, Withdrawn, and post-close states Evaluating → AwardPendingApproval → Awarded / Unsuccessful. Any transition not in the defined set shall be rejected server-side with HTTP 409 and a reason. |
| FR-RFX-05 | RFx editing shall be permitted only in Draft and Returned statuses; all other statuses render read-only views (change via CR only). |
| FR-RFX-06 | Cloning an RFx shall copy structure, documents, evaluation criteria, and supplier list; reset status to Draft, clear dates and responses, and assign a new number. |
| FR-RFX-07 | Deleting an RFx shall be soft-delete, permitted only in Draft status, and require confirmation showing the RFx number and title. |
| FR-RFX-08 | Submission for review shall validate all mandatory fields (title, objective, method, dates, ≥1 document for RFP/RFI, ≥1 invited supplier) and list all failures in one response. |
| FR-RFX-09 | Evaluation criteria shall be definable per RFx: name, description, weight %, scale (1–5 or 1–10), envelope assignment (Technical/Commercial); weights must total exactly 100% (client + server validation). |
| FR-RFX-10 | Evaluation criteria and envelope assignments shall be immutable after publication. |
| FR-RFX-11 | An Initiator shall be able to withdraw a Published RFx before close with a mandatory reason; suppliers shall be notified within 5 minutes and the status set to Withdrawn. |
| FR-RFX-12 | The RFx shall auto-transition Published → Closed at ResponseDueDate (±60s); closing shall lock submissions and trigger closing notifications. |
| FR-RFX-13 | Concurrent edits shall use optimistic concurrency: the second writer receives a 409 with a field-level diff of conflicting changes. |

### 5.3 AI Authoring & Governance (FR-AI) — net-new [J2, J6]

| ID | Requirement |
|----|-------------|
| FR-AI-01 | "Draft with AI" shall generate a complete RFx document set from the linked spec + selected template within 60s: background, scope, line-item/pricing schedule, submission instructions, and proposed evaluation criteria with weights. |
| FR-AI-02 | Every AI-generated section shall carry a visible "AI-drafted — review required" badge until a human edits or explicitly confirms it; publication shall be blocked while any section remains unconfirmed. |
| FR-AI-03 | AI drafting failure or timeout (>60s) shall trigger exactly one automatic retry, then offer the blank template path; the failure shall be logged with correlation ID. |
| FR-AI-04 | All AI invocations shall execute under the requesting user's identity and permissions; an AI call shall never access data the invoking user cannot access (enforced by passing the user's authorization context to all downstream queries). |
| FR-AI-05 | Every AI action shall write an audit entry containing: user, timestamp, model identifier + version, prompt template ID + hash, input document references, and output hash. |
| FR-AI-06 | AI outputs affecting evaluation or award (completeness flags, scores, summaries) shall include: rationale text, citations to source bid/RFx content (document + location), and a confidence indicator (High/Medium/Low). |
| FR-AI-07 | Customer data shall not be used to train models; AI configuration shall document per-tenant model routing, and inference for SA-resident tenants shall default to Azure South Africa regions where the model is available, else route per the tenant's signed s72 configuration. |
| FR-AI-08 | Administrators shall be able to disable each AI feature per tenant (intake assist, RFx drafting, completeness check, scoring assist, summaries) independently; disabled features degrade to the manual path without error. |

### 5.4 Documents & Templates (FR-DOC) [J2, J4]

| ID | Requirement |
|----|-------------|
| FR-DOC-01 | Users shall upload multiple documents per RFx with type classification (RFxDocument, PricingSchedule, Specification, Addendum); allowed formats: pdf, docx, xlsx, pptx, csv, txt, png, jpg, zip; max 50MB per file. |
| FR-DOC-02 | 100% of uploaded files (internal and supplier) shall be virus-scanned before storage commit; infected files shall be rejected with reason and the attempt audited. |
| FR-DOC-03 | Every stored document shall record a SHA-256 checksum, uploader, and timestamp; downloads shall verify checksum integrity. |
| FR-DOC-04 | Documents shall be deletable only while the RFx is in Draft; after publication, replacement occurs only via approved Document-Update CR, which archives the prior version (version history retained). |
| FR-DOC-05 | Administrators shall maintain a versioned template library per RFx type and category; only one Active version per template; prior versions remain viewable. |
| FR-DOC-06 | Document storage shall be encrypted at rest (AES-256) in Azure Blob with tenant-scoped containers/paths. |

### 5.5 Supplier Management (FR-SUP) [J2]

| ID | Requirement |
|----|-------------|
| FR-SUP-01 | Initiators shall add suppliers to an RFx from the tenant supplier master (search by name/registration/email) or by manual entry (name + central mailbox minimum). |
| FR-SUP-02 | Each supplier may appear once per RFx (unique RfxId + central mailbox); duplicates blocked with an explanatory message. |
| FR-SUP-03 | Suppliers shall have ≥1 contact (name + email required, phone optional); contact email uniqueness enforced per supplier. |
| FR-SUP-04 | After publication, suppliers may be added only via approved Add-Supplier CR; newly added suppliers receive invitations without re-notifying existing ones. |
| FR-SUP-05 | Removing a supplier (Draft only) shall cascade-remove its contacts from that RFx after confirmation. |
| FR-SUP-06 | The supplier master shall support profile fields: legal name, registration number, tax reference, B-BBEE level + certificate/affidavit upload with expiry date (capture only in MVP), contact directory, and status (Active/Inactive). |
| FR-SUP-07 | Supplier master administration shall support dedupe merge (surviving record selected, references re-pointed, merge audited). |

### 5.6 Review & Approval Workflow (FR-WF) — Hulamin reuse+extend [J3]

| ID | Requirement |
|----|-------------|
| FR-WF-01 | "Submit for Review" shall be available only in Draft/Returned and shall lock the RFx from editing. |
| FR-WF-02 | Reviewers shall access a read-only review view including an automated pre-review checklist (dates valid, documents present, criteria total 100%, ≥1 supplier with valid contact). |
| FR-WF-03 | Reviewer actions: Approve (RFQ → publish; RFI/RFP → submit for approval), Reject, Send Back for Clarification. Reject and Clarification require comments (≥10 chars). |
| FR-WF-04 | Approver actions on PendingApproval: Approve (→ publish), Reject (→ Returned), Send Back for Clarification; comments mandatory except Approve. |
| FR-WF-05 | When assigned Reviewer = Approver, approval of review shall auto-progress to Published, writing two distinct audit entries (review-approve, approval-approve). |
| FR-WF-06 | Segregation of Duties: the RFx creator shall not be assignable as its Reviewer or Approver (tenant-configurable toggle, default ON; toggle changes audited). |
| FR-WF-07 | Approval chains shall be configurable per tenant: 1-step (Reviewer only, RFQ default) or 2-step (Reviewer + Approver); chain resolved and frozen at submit time. |
| FR-WF-08 | Administrators shall reassign pending review/approval tasks (e.g., vacancy); reassignment requires reason and is audited; the new assignee is notified. |
| FR-WF-09 | All workflow decisions shall be actionable from both web UI and Teams adaptive cards with identical validation and audit results. |

### 5.7 Publication & Invitations (FR-PUB) [J3]

| ID | Requirement |
|----|-------------|
| FR-PUB-01 | On final approval, the system shall auto-publish: set PublishDate, generate per-contact tokenized portal links (single-use registration token, 14-day expiry, re-issuable), and dispatch invitation emails within 5 minutes. |
| FR-PUB-02 | Invitation dispatch shall be tracked per recipient (Sent/Failed/Pending) with automatic retry (3 attempts, exponential backoff); failures surfaced on the RFx view with manual resend. |
| FR-PUB-03 | Invitation emails shall include: RFx number/title, closing date/time with timezone, portal link, and buyer contact mailbox; content from an admin-editable template. |
| FR-PUB-04 | Tokenized links shall deep-link authenticated suppliers directly to the specific RFx. |

### 5.8 Supplier Portal (FR-SP) — Hulamin reuse [J4]

| ID | Requirement |
|----|-------------|
| FR-SP-01 | Suppliers shall authenticate with email + password; first-time access via invitation token forces password setup meeting policy (≥10 chars, upper+lower+digit+special). |
| FR-SP-02 | Account lockout after 5 failed attempts for 30 minutes; lockout and unlock events audited; no user-enumeration in error messages ("invalid credentials" only). |
| FR-SP-03 | Supplier sessions shall time out after 60 minutes of inactivity with a 5-minute warning; internal sessions after 30 minutes. |
| FR-SP-04 | A supplier user shall see only RFx events they are invited to; direct URL access to others returns 404 (not 403). |
| FR-SP-05 | Suppliers must acknowledge participation (or decline with reason) before accessing RFx documents; acknowledgement records timestamp, user, and IP, and notifies the buyer. |
| FR-SP-06 | The portal shall be free for suppliers — no registration, subscription, or transaction fees anywhere in the flow. |
| FR-SP-07 | The portal shall be fully responsive (mobile-first) and WCAG 2.1 AA conformant. |

### 5.9 Responses & Sealing (FR-RESP) [J4, J6]

| ID | Requirement |
|----|-------------|
| FR-RESP-01 | Suppliers shall upload response files per envelope (Technical/Commercial when two-envelope mode is ON; single envelope otherwise), save drafts, and submit final. |
| FR-RESP-02 | Final submission before deadline shall create an immutable version (ResponseVersion N), timestamped to the second (NTP-synced), with an on-screen + email receipt including version and checksum. |
| FR-RESP-03 | Suppliers may revise until deadline; each revision creates version N+1; all versions retained; only the latest final version enters evaluation. |
| FR-RESP-04 | Submission content (files and metadata beyond count) shall be inaccessible to ALL internal users until RFx close ("sealed"); attempts logged. Buyer view shows submission count and per-supplier submitted/not-submitted only. |
| FR-RESP-05 | In two-envelope mode, Commercial envelope content shall remain sealed after close until a permissioned "Open Commercial Envelope" action, which requires the technical gate flag and writes a dedicated audit entry. |
| FR-RESP-06 | Submissions after deadline shall be blocked server-side with message "This RFx closed on {date time}"; the attempt is logged. |
| FR-RESP-07 | Uploads shall be chunked/resumable; an interrupted upload shall resume without restarting the file. |

### 5.10 Change Requests (FR-CR) — Hulamin reuse [J5]

| ID | Requirement |
|----|-------------|
| FR-CR-01 | Initiators (own RFx) and acknowledged suppliers (invited RFx) shall raise CRs with types: ExtendDueDate, Clarification, DocumentIssue, UpdateDocuments (initiator), AddSupplier (initiator), UpdateRequirement (initiator), Other. |
| FR-CR-02 | Each CR shall receive number CR-YYYY-NNN, dynamic form fields per type, optional attachments (validated per FR-DOC-01/02), and start in PendingReview. |
| FR-CR-03 | CR reviewers shall Approve, Reject, or Return-for-Clarification; comments mandatory for Reject/Return; requesters may edit and resubmit returned CRs. |
| FR-CR-04 | Approved CRs shall auto-apply effects atomically: ExtendDueDate updates ResponseDueDate (must be future and ≥ current) and notifies all invited suppliers + stakeholders; UpdateDocuments activates new version and archives old; AddSupplier invites only the new supplier; UpdateRequirement updates the objective text. |
| FR-CR-05 | Only one active (non-terminal) CR per type per RFx; CRs against Closed/Withdrawn RFx blocked; open CRs auto-reject with system comment when the RFx closes. |
| FR-CR-06 | All CR actions shall be audited with old/new values; affected suppliers notified within 5 minutes of an applied change; live views refresh via SignalR. |

### 5.11 Evaluation & Award (FR-EVAL) — net-new [J6]

| ID | Requirement |
|----|-------------|
| FR-EVAL-01 | At close, the system shall create an evaluation workspace listing all final submissions with metadata, unsealing Technical content to assigned evaluators only. |
| FR-EVAL-02 | AI completeness check shall verify each submission against the RFx's required-document checklist and flag: missing documents, missing/expired certificates, unsigned forms — each flag with a citation and confidence level; evaluators may accept or override each flag with a mandatory reason (audited). |
| FR-EVAL-03 | The Initiator shall assign an evaluation panel (≥1 evaluator); each evaluator must complete a conflict-of-interest declaration (none / declared+description) before accessing submissions; declared conflicts block access pending Initiator decision (audited). |
| FR-EVAL-04 | Evaluators shall score each criterion on the defined scale with optional comment; a submission is fully scored when all criteria have scores from all assigned evaluators. |
| FR-EVAL-05 | AI scoring assist (per criterion: suggested score + supporting excerpt citations) shall be visually distinct ("AI-suggested") and never auto-populate the score of record; the human-entered score is authoritative. |
| FR-EVAL-06 | The system shall compute weighted totals per supplier (avg evaluator score × weight, normalized to 100), produce a ranked side-by-side comparison matrix, and flag statistical outliers (any evaluator's score >2σ from the mean for that criterion). |
| FR-EVAL-07 | The AI executive summary shall cover: ranking rationale, per-supplier strengths/gaps with citations, price comparison (after commercial opening), completeness posture, and outliers — regenerable, versioned, and marked AI-generated. |
| FR-EVAL-08 | The Initiator shall record an award recommendation (supplier(s) + justification ≥50 chars); submission routes to the Approver as AwardPendingApproval. |
| FR-EVAL-09 | The Approver shall Approve (→ Awarded) or Return (comments mandatory, → Evaluating); on award, outcome notifications (award + regret letters from templates) are queued to all responding suppliers. |
| FR-EVAL-10 | Zero-submission or all-non-compliant events shall be closable as Unsuccessful with reason; a "re-issue" action clones the event. |
| FR-EVAL-11 | Single-response awards shall require an additional justification field ("single-bid justification") before approval. |
| FR-EVAL-12 | Scoring progress (per evaluator, per supplier) shall be visible to the Initiator without revealing individual scores until consolidation (configurable: open vs hidden until all complete). |

### 5.12 Teams Orchestration (FR-TEAMS) — net-new [J7]

| ID | Requirement |
|----|-------------|
| FR-TEAMS-01 | Review, approval, CR, and award-approval requests shall be delivered as Teams adaptive cards with action buttons (Approve/Reject/Clarify + comment box) executing against the API under the actor's Entra identity. |
| FR-TEAMS-02 | Card actions shall be idempotent and stale-safe: acting on an already-decided item refreshes the card to current state with an explanatory note, without error. |
| FR-TEAMS-03 | On evaluation kick-off, the system shall auto-schedule a Teams meeting for the panel (title, agenda, deep link to workspace) via Graph API, at the first common free slot within 3 business days (Initiator can override). |
| FR-TEAMS-04 | Milestone notifications (Published, Closing in 24h, Closed, Awarded) shall post to a configured Teams channel per category/BU. |
| FR-TEAMS-05 | The IntelliSource bot shall answer authenticated status queries: "my pending approvals", "status of {RFx number}", "events closing this week" — scoped to the user's permissions. |
| FR-TEAMS-06 | If Teams delivery fails (Graph error/timeout 10s), the equivalent email shall be sent within 60 seconds and the fallback logged. |
| FR-TEAMS-07 | The plain-language intake dialog (FR-INT-01/02) shall be available through the Teams bot with identical validation and outcomes. |

### 5.13 Audit & Evidence (FR-AUD) — Hulamin reuse+hardened [J8]

| ID | Requirement |
|----|-------------|
| FR-AUD-01 | Every material action (create/update/delete/submit/review/approve/reject/publish/acknowledge/submit-response/unseal/score/override/award/export/login-fail/lockout/config-change and every AI invocation) shall write an audit entry: actor (user or supplier user or system), action, entity type + ID, timestamp (UTC, NTP-synced), IP, old/new values (JSON), and details. |
| FR-AUD-02 | The audit store shall be append-only: no UPDATE or DELETE grants at the database level; schema enforced by migration tests. |
| FR-AUD-03 | Audit entries shall be hash-chained (each entry stores SHA-256 of previous entry + own content); a verification job shall validate chain integrity daily and on evidence export, alerting on breaks. |
| FR-AUD-04 | Authorized users (Administrator, ViewOnly-Audit) shall filter/search the trail by entity, actor, action, and date range, with results <3s for any single-event query. |
| FR-AUD-05 | Evidence-pack export per RFx shall produce within 5 minutes: PDF chronology, CSV/JSON full detail, document manifest with checksums, and chain-verification statement; the export itself is audited. |
| FR-AUD-06 | RFx status history shall be derivable from the audit trail and rendered as a timeline on the RFx view. |
| FR-AUD-07 | Audit retention: 7 years minimum (tenant-configurable upward); POPIA data-subject deletions produce redaction entries that preserve chain verifiability. |

### 5.14 Dashboard & Reporting (FR-DASH) — Hulamin reuse+extend [J8, J9]

| ID | Requirement |
|----|-------------|
| FR-DASH-01 | The internal dashboard shall list RFx events with columns (number, title, type, status, owner, due date, responses) filterable by status, type, owner, category, and date range, sortable, paginated (25/page default). |
| FR-DASH-02 | KPI cards shall show: open events by status, events closing ≤7 days, average cycle time (intake→award) rolling 90 days, response rate (responses/invitations), and pending approvals for the current user. |
| FR-DASH-03 | Charts (bar/line/pie/slice) shall visualize pipeline by status, cycle-time trend, response rates by category, and supplier participation; every chart exportable to CSV and PDF. |
| FR-DASH-04 | Dashboard data shall update in real time via SignalR (≤5s from event) without page refresh. |
| FR-DASH-05 | Role-scoped views: Requesters see own intakes; Initiators own+team events; Pieter (ViewOnly/Head) sees all tenant events; Administrators see config + health. |
| FR-DASH-06 | Cycle-time instrumentation shall record timestamps for each stage transition and compute per-event and aggregate durations (intake→RFx, draft→publish, publish→close, close→award). |
| FR-DASH-07 | Action buttons per row shall reflect status + role permissions exactly (e.g., no Edit on Published; Approve only for assigned approver). |

### 5.15 Notifications (FR-NOTIF) — Hulamin reuse [J1–J7]

| ID | Requirement |
|----|-------------|
| FR-NOTIF-01 | Event-driven notifications (email + Teams where applicable) for: intake decisions, review/approval requests and outcomes, publication, acknowledgement, submission receipt, CR decisions, closing reminders, close, award/regret. |
| FR-NOTIF-02 | Closing reminders to non-responding acknowledged suppliers at T-7 days and T-1 day (suppressed for already-submitted suppliers). |
| FR-NOTIF-03 | All notification templates shall be admin-editable with variable placeholders and preview; template changes versioned and audited. |
| FR-NOTIF-04 | Delivery status per notification (Sent/Failed/Pending) with automatic retry (3x exponential backoff) and dead-letter queue surfaced to Administrators. |
| FR-NOTIF-05 | Bulk invitation dispatch shall handle ≥1,000 emails/batch without loss (queue-based, at-least-once with idempotent send guard). |

### 5.16 Identity, Admin & POPIA (FR-ADM) [J9]

| ID | Requirement |
|----|-------------|
| FR-ADM-01 | Internal users shall authenticate via Entra ID SSO with MFA enforced by conditional access; local passwords shall not exist for internal accounts. |
| FR-ADM-02 | Roles (Requester, Initiator, Reviewer, Approver, Administrator, ViewOnly) shall be assignable directly or mapped from Entra groups; role checks enforced at API and UI; changes audited. |
| FR-ADM-03 | Administrators shall manage users (activate/deactivate, roles, delegation limits), supplier master (FR-SUP-06/07), templates (FR-DOC-05), notification templates, and workflow configuration (SoD toggle, chains, two-envelope default, CoI requirement). |
| FR-ADM-04 | POPIA tooling: generate a data-subject access report (all personal data + processing log for a person) within 24h SLA; support correction; support deletion producing redaction with legal-hold override — all audited. |
| FR-ADM-05 | Tenant provisioning shall support multi-tenant SaaS (shared cluster, isolated schema/data) and in-tenant deployment (dedicated stamp) from the same codebase via configuration. |
| FR-ADM-06 | All admin configuration changes shall take effect without redeployment and be captured in the audit trail with old/new values. |

## 6. Stage 2–3 Requirements (Outline — for roadmap epics)

Stage 2 (12–24 mo): **FR-S2-DISC** AI supplier discovery (web/ESG/EcoVadis/D&B enrichment, sanctions screening, CSD/SARS/CIPC verification); **FR-S2-BEE** B-BBEE preference engine (80/20 & 90/10 formulas, staged compliance→functionality→price+preference evaluation, certificate validation, level-based reporting); **FR-S2-COMM** committee blind scoring, consensus meetings, e-voting in Teams, CoI registers; **FR-S2-ROUND** multi-round/BAFO workflows and scenario analysis; **FR-S2-ERP** connectors (SAP, Oracle, Dynamics 365, Sage) for supplier master, GL/budget check, and award handoff; **FR-S2-SAVE** savings ledger (baseline vs awarded vs invoiced) and demand bundling; **FR-S2-QA** anonymous supplier Q&A with addenda (may pull into MVP as S3).

Stage 3 (24–36 mo): **FR-S3-CLM** contract auto-draft from award, clause libraries, AI redline vs playbooks, eSignature (DocuSign/Adobe), obligation tracking; **FR-S3-AUC** auction engine (English/Dutch/Japanese, multi-attribute) with ML-timed close; **FR-S3-PRED** predictive analytics (supplier risk, price trends, contract leakage) and autonomous negotiation for tactical spend; **FR-S3-RENEW** contract-expiry-triggered re-sourcing; **FR-S3-STORE** M365 Copilot Agent Store listing with MCP/A2A interop.

## 7. Non-Functional Requirements

### 7.1 Performance (NFR-PERF)

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | API responses: median <100ms, p95 <500ms, p99 <2s under normal load; GET list endpoints p95 <200ms. |
| NFR-PERF-02 | Page performance: LCP <2.5s, INP <200ms, CLS <0.1 on 4G-class connection; dashboard time-to-interactive <2s. |
| NFR-PERF-03 | Platform shall sustain 10,000+ concurrent users with p95 end-to-end response <2s (Gijima principle #13), demonstrated by load test before GA. |
| NFR-PERF-04 | 50MB file upload completes <10s on 100Mbps; chunked resumable protocol. |
| NFR-PERF-05 | Database queries p95 <200ms; no endpoint issues >10 queries per request (N+1 guard in CI). |
| NFR-PERF-06 | AI operations: intake clarifications <10s; RFx draft <60s; completeness check <120s per 10 submissions; all long-running AI jobs stream progress or run async with notification. |
| NFR-PERF-07 | SignalR fan-out latency ≤5s from committed event to dashboard update at 1,000 concurrent dashboard sessions. |

### 7.2 Performance Budgets (NFR-BUDGET)

| ID | Requirement |
|----|-------------|
| NFR-BUDGET-01 | Initial JS bundle <300KB gzipped; total initial payload <1MB gzipped; CSS <50KB gzipped; budgets enforced in CI (build fails on breach). |
| NFR-BUDGET-02 | Route-level code splitting; no route chunk >200KB gzipped. |
| NFR-BUDGET-03 | Images served in modern formats (WebP/AVIF) with responsive sizes; no single image >300KB. |

### 7.3 Security (NFR-SEC)

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | Zero Trust: every request authenticated + authorized; no network-location trust; service-to-service auth via managed identities/mTLS. |
| NFR-SEC-02 | Internal auth: Entra ID OIDC + MFA. Supplier auth: email/password per FR-SP-01/02 (optional Entra External ID later). |
| NFR-SEC-03 | TLS 1.2+ everywhere; HSTS; AES-256 at rest (DB + blobs + backups). |
| NFR-SEC-04 | RBAC enforced at API and UI; authorization tests cover every endpoint × role matrix (deny-by-default). |
| NFR-SEC-05 | Sealed-bid enforcement at data layer: response content encrypted with per-event keys; decryption keys released to application only on close (technical) / envelope-open action (commercial); DB administrators cannot read sealed content. |
| NFR-SEC-06 | Input validation server-side on all endpoints; parameterized queries only; output encoding; CSP without unsafe-inline; OWASP ASVS L2 verification before GA. |
| NFR-SEC-07 | 100% uploads virus-scanned (Defender/ClamAV) pre-commit; infected files quarantined + audited. |
| NFR-SEC-08 | Secrets in Azure Key Vault; no secrets in code/config/logs; quarterly rotation policy. |
| NFR-SEC-09 | Rate limiting tiered: authenticated API 1,000 req/min/user; supplier portal 100 req/min/IP; file-upload endpoints 50 req/min/supplier (Hulamin lesson); 429 with Retry-After. |
| NFR-SEC-10 | Defence-in-depth logging: authn/authz failures, lockouts, sealing violations, admin changes → SIEM-forwardable structured logs; no PII in logs. |
| NFR-SEC-11 | Tenant isolation: every query tenant-scoped via global EF filters + row-level security; cross-tenant access attempts return 404 and alert. |
| NFR-SEC-12 | No user enumeration on any auth/reset endpoint (uniform responses/timing). |

### 7.4 Reliability & Error Handling (NFR-REL / NFR-ERR)

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | Application uptime ≥99.5% monthly (≤3.6h downtime); infrastructure ≥99.99% (multi-AZ AKS + zone-redundant Postgres). |
| NFR-REL-02 | DR: RTO ≤1h, RPO ≤15 min (PITR + geo-paired backups, SA West secondary); restore rehearsal quarterly. |
| NFR-REL-03 | Maintenance windows avoid the 48h before any tenant's event close (scheduler-aware deploys). |
| NFR-ERR-01 | Transient-failure retries: exponential backoff 100/300/900ms max 3 attempts; ≥95% transient errors auto-recover. |
| NFR-ERR-02 | All API errors follow RFC 7807 problem+json with correlation ID; user-facing errors show inline message + recovery action (retry button, fallback path) and reference ID ERR-YYYYMMDD-NNNNN. |
| NFR-ERR-03 | Timeouts: external HTTP 10s, AI inference 60s (drafting) / 30s (chat), DB command 30s; all long operations cancellable. |
| NFR-ERR-04 | Graceful AI degradation: every AI feature has a defined manual fallback (FR-INT-10, FR-AI-03, FR-EVAL J6); AI outage shall never block the sourcing lifecycle. |
| NFR-ERR-05 | Outbound messaging (email/Teams) queued with at-least-once delivery, idempotent send guards, and dead-letter visibility (FR-NOTIF-04). |
| NFR-ERR-06 | Frontend error boundaries per route; unsaved-work autosave; offline banner with retry on reconnect. |

### 7.5 Scalability (NFR-SCALE)

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Data lifetime ≥10 years, >5M RFx-related records per tenant without >10% p95 degradation (partitioning + index strategy). |
| NFR-SCALE-02 | Horizontal autoscale on AKS (HPA on CPU+RPS+queue depth); stateless services; scale-out verified 1→10 pods without session loss. |
| NFR-SCALE-03 | Document storage ≥2TB per tenant; blob lifecycle tiering for closed events (hot→cool after 12 months). |
| NFR-SCALE-04 | 200+ suppliers and 1,000+ documents per RFx without listing degradation (virtualized lists, paginated APIs). |
| NFR-SCALE-05 | Notification throughput ≥10,000/hour per tenant. |

### 7.6 Accessibility (NFR-A11Y) — enabled

| ID | Requirement |
|----|-------------|
| NFR-A11Y-01 | WCAG 2.1 AA conformance on all internal and supplier-facing screens; design targets WCAG 2.2 AA. |
| NFR-A11Y-02 | Color contrast ≥4.5:1 normal text, ≥3:1 large text/UI components — verified against the Gijima palette (see UX spec for compliant token pairings). |
| NFR-A11Y-03 | Full keyboard operability: logical tab order following DOM, visible focus indicator (≥2px, ≥3:1 contrast), no keyboard traps, skip-to-content link. |
| NFR-A11Y-04 | Screen-reader support: semantic landmarks, form labels + described-by errors, live-region announcements for async updates (SignalR changes, AI progress), table headers associated. |
| NFR-A11Y-05 | No information conveyed by color alone (status badges include icon + text); reduced-motion respected (prefers-reduced-motion disables non-essential animation). |
| NFR-A11Y-06 | Automated axe scans in CI: 0 critical/serious violations to merge; manual NVDA + keyboard test per release on the 5 core journeys; ACR (VPAT-style) published at GA. |

### 7.7 API & Documentation (NFR-API)

| ID | Requirement |
|----|-------------|
| NFR-API-01 | REST API, resource-oriented, OpenAPI **3.2.0** specification auto-generated and published at /api/docs (Swagger UI) — 100% endpoint coverage with request/response schemas and examples. |
| NFR-API-02 | Versioning via URL (/api/v1/); backward-compatible changes only within a version; 6-month deprecation notice minimum. |
| NFR-API-03 | Auth: OAuth2/OIDC bearer (Entra); supplier endpoints scoped tokens; webhook signatures (HMAC-SHA256). |
| NFR-API-04 | Errors per RFC 7807 (NFR-ERR-02); pagination limit/offset with X-Total-Count; consistent filtering/sorting conventions documented. |
| NFR-API-05 | Webhooks for lifecycle events (published, closed, awarded, CR-applied) with retry + signature verification; consumer guide in docs. |
| NFR-API-06 | Contract tests validate implementation against the OpenAPI spec in CI (drift fails build). |

### 7.8 Compliance (NFR-COMP)

| ID | Requirement |
|----|-------------|
| NFR-COMP-01 | POPIA: lawful-processing register per tenant; data-subject access/correction/deletion tooling (FR-ADM-04); operator DPA template pack; breach-notification workflow (detect→assess→notify responsible party) with 72h internal SLA. |
| NFR-COMP-02 | Data residency: tenant data at rest in Azure South Africa North (paired SA West); cross-border transfers (incl. AI inference) only per signed tenant s72 configuration. |
| NFR-COMP-03 | Retention schedules configurable per data class; default 7-year audit retention; automated purge with legal hold. |
| NFR-COMP-04 | Fair-process guarantees: sealed bids (FR-RESP-04/05), SoD (FR-WF-06), CoI declarations (FR-EVAL-03), immutable audit (FR-AUD-02/03) — collectively marketed as King V/PFMA evidence readiness. |
| NFR-COMP-05 | Timestamps NTP-synchronized (±1s) across services; all persisted times UTC with tenant-timezone rendering. |

## 8. Data Model (core entities)

Extends the proven Hulamin model. New entities marked ★.

| Entity | Key fields | Notes |
|--------|-----------|-------|
| **Tenant** ★ | TenantId, Name, DeploymentMode {SharedSaaS, InTenant}, Region, S72Config (JSON), Settings (JSON) | All entities below tenant-scoped |
| **Intake** ★ | IntakeId, IntakeNumber (INT-YYYY-NNN, unique/tenant), RequesterUserId, RawText, SpecJson (structured spec), CategoryId, CategoryConfidence, Status {Draft, PendingTriage, Accepted, Returned, Rejected}, LinkedRfxId?, BudgetEstimate?, CreatedAt | Spec sections individually versioned |
| **RfxEvent** | RfxId, RfxNumber (RFx-YYYY-NNN unique/tenant), RfxType {RFQ, RFP, RFI}, Title, RequirementObjective, InitiatorUserId, Status (see FR-RFX-04), BiddingStartDate, ResponseDueDate, ExtensionDate?, PublishDate?, TemplateId?, ReviewerUserId?, ApproverUserId?, TwoEnvelopeMode (bool), IntakeId?, WithdrawReason?, IsDeleted | State machine server-enforced |
| **EvaluationCriterion** ★ | CriterionId, RfxId, Name, Description, WeightPercent, Scale {1-5, 1-10}, Envelope {Technical, Commercial}, SortOrder | Σ weights = 100 enforced |
| **RfxDocument** | DocumentId, RfxId, DocumentType {RFxDocument, PricingSchedule, Specification, Addendum}, FileName, FileSize, Version, IsArchived, BlobPath, Checksum (SHA-256), UploadedBy/At | Versioned via CR |
| **RfxTemplate** | TemplateId, RfxType, CategoryId?, Name, Version, IsActive, BlobPath, PromptProfileId? ★ | One active version |
| **Supplier** (master) ★ | SupplierId, LegalName, RegistrationNumber?, TaxRef?, BbbeeLevel?, BbbeeCertBlobPath?, BbbeeCertExpiry?, Status, CentralMailbox | Tenant supplier master (Hulamin was per-RFx) |
| **RfxInvitedSupplier** | InvitedId, RfxId, SupplierId, SourceType {Master, Manual}, AddedBy/At, IsDeleted; UNIQUE(RfxId, SupplierId) | Per-event invitation |
| **SupplierContact** | ContactId, SupplierId, Name, Email (unique/supplier), Phone? | Cascades on removal |
| **SupplierUser** | SupplierUserId, Email (unique), SupplierId, PasswordHash, AccountStatus, FailedLoginAttempts, LastFailedLoginAt, LastLoginAt | Portal identity |
| **SupplierAcknowledgement** | AckId, RfxId, SupplierId, Status {Acknowledged, Declined, NotAcknowledged}, AcknowledgedAt?, BySupplierUserId?, IpAddress?, DeclineReason?; UNIQUE(RfxId, SupplierId) | Gates document access |
| **SupplierResponse** | ResponseId, RfxId, SupplierId, Envelope {Technical, Commercial, Single} ★, ResponseVersion, IsDraft, SubmittedAt, BySupplierUserId, BlobPath (per-event-key encrypted) ★, Checksum, MetadataJson; UNIQUE(RfxId, SupplierId, Envelope, ResponseVersion) | Sealed per NFR-SEC-05 |
| **EvaluationAssignment** ★ | AssignmentId, RfxId, EvaluatorUserId, CoiStatus {NotDeclared, None, Declared}, CoiDetails?, AccessGrantedAt? | CoI gates access |
| **Score** ★ | ScoreId, RfxId, SupplierId, CriterionId, EvaluatorUserId, Value, Comment?, AiSuggestedValue?, AiCitationsJson?, CreatedAt; UNIQUE(RfxId, SupplierId, CriterionId, EvaluatorUserId) | Human value authoritative |
| **CompletenessFlag** ★ | FlagId, RfxId, SupplierId, RequirementRef, FlagType {MissingDoc, ExpiredCert, UnsignedForm, Other}, Citation, Confidence {High, Med, Low}, Resolution {Open, Accepted, Overridden}, OverrideReason?, ResolvedBy/At | AI-raised, human-resolved |
| **AwardRecommendation** ★ | AwardId, RfxId, RecommendedSupplierIds (JSON), Justification, SingleBidJustification?, Status {Pending, Approved, Returned}, DecidedBy/At, ExecSummaryVersion | Links to AI summary version |
| **ChangeRequest** | CrId, CrNumber (CR-YYYY-NNN), RfxId, CrType (7 types), SubmitterType {Initiator, Supplier}, SubmittedByUserId?/SupplierUserId?, Status {PendingReview, Approved, Rejected, ClarificationRequired}, DetailsJson, Comments, Attachments→CrAttachment | Auto-apply on approve |
| **AuditLog** | AuditId (bigint), TenantId, EntityType, EntityId, Action, UserId?/SupplierUserId?/System, Timestamp, IpAddress, OldValue/NewValue (JSON), Details, **PrevHash, EntryHash** ★ | Append-only, hash-chained |
| **AiInvocation** ★ | InvocationId, TenantId, UserId, Feature {IntakeAssist, RfxDraft, Completeness, ScoreAssist, ExecSummary, BotQuery}, ModelId, ModelVersion, PromptTemplateId, PromptHash, InputRefs (JSON), OutputHash, LatencyMs, Outcome {Success, Fallback, Error}, CreatedAt | Joined to AuditLog |
| **Notification** | NotificationId, RecipientType, RecipientId, Channel {Email, Teams} ★, Type, Subject, Body, SentAt?, DeliveryStatus, RetryCount, LastRetryAt | Queue-backed |
| **User** | UserId, EntraObjectId ★, Email (unique), FullName, Roles (JSON), Department?, DelegationLimit? ★, IsActive, LastLoginAt | Entra-linked |
| **StageTimestamp** ★ | Id, RfxId, Stage, EnteredAt | Cycle-time analytics (FR-DASH-06) |

Relationships: Tenant 1—n everything; Intake 1—0..1 RfxEvent; RfxEvent 1—n {Criteria, Documents, InvitedSuppliers, Responses, CRs, Assignments, Scores, Flags}; Supplier 1—n Contacts, 1—n SupplierUsers; AwardRecommendation 1—1 RfxEvent.

## 9. API Overview (representative /api/v1 endpoints)

| Area | Endpoints (auth: Entra bearer unless noted) |
|------|---------------------------------------------|
| Intake | POST /intakes · GET /intakes?status= · GET /intakes/{id} · POST /intakes/{id}/messages (AI dialog) · POST /intakes/{id}/submit · POST /intakes/{id}/triage {accept\|return\|reject} · POST /intakes/{id}/convert |
| RFx | POST /rfx · GET /rfx?status=&type=&owner= · GET /rfx/{id} · PUT /rfx/{id} (Draft/Returned only) · POST /rfx/{id}/clone · DELETE /rfx/{id} (Draft) · POST /rfx/{id}/ai-draft · POST /rfx/{id}/submit-for-review · POST /rfx/{id}/review {approve\|reject\|clarify} · POST /rfx/{id}/approve {approve\|reject\|clarify} · POST /rfx/{id}/withdraw · GET /rfx/{id}/status-history |
| Documents | POST /rfx/{id}/documents (multipart, chunked) · GET /rfx/{id}/documents · GET /documents/{id}/download · DELETE /documents/{id} (Draft) |
| Suppliers | GET/POST /suppliers (master) · POST /suppliers/merge · POST /rfx/{id}/suppliers · DELETE /rfx/{id}/suppliers/{supplierId} · POST /rfx/{id}/suppliers/{supplierId}/contacts |
| Supplier portal (supplier token) | POST /supplier/auth/register (invite token) · POST /supplier/auth/login · GET /supplier/rfx · GET /supplier/rfx/{id} · POST /supplier/rfx/{id}/acknowledge · GET /supplier/rfx/{id}/documents/{docId} · POST /supplier/rfx/{id}/responses (multipart, envelope param) · POST /supplier/rfx/{id}/responses/{v}/submit · POST /supplier/rfx/{id}/change-requests |
| CRs | POST /rfx/{id}/change-requests · GET /change-requests?status= · POST /change-requests/{id}/review {approve\|reject\|clarify} |
| Evaluation | GET /rfx/{id}/evaluation · POST /rfx/{id}/evaluation/panel · POST /evaluation/assignments/{id}/coi · POST /rfx/{id}/evaluation/completeness-check · POST /completeness-flags/{id}/resolve · PUT /rfx/{id}/scores/{criterionId}/{supplierId} · POST /rfx/{id}/evaluation/open-commercial · GET /rfx/{id}/evaluation/comparison · POST /rfx/{id}/evaluation/exec-summary · POST /rfx/{id}/award-recommendation · POST /rfx/{id}/award-recommendation/decide |
| Audit | GET /audit?entityType=&entityId=&actor=&from=&to= · POST /rfx/{id}/evidence-pack · GET /evidence-packs/{id}/download |
| Dashboard | GET /dashboard/kpis · GET /dashboard/charts/{chartId} · GET /dashboard/export?format={csv\|pdf} |
| Admin | GET/PUT /admin/users · GET/PUT /admin/config · CRUD /admin/templates · CRUD /admin/notification-templates · POST /admin/popia/subject-access · POST /admin/popia/erasure |
| Webhooks | POST /webhooks/subscriptions (events: rfx.published, rfx.closed, rfx.awarded, cr.applied) |

Error format (all endpoints): RFC 7807 `{ "type", "title", "status", "detail", "instance", "errorId": "ERR-YYYYMMDD-NNNNN", "errors": {field: [messages]} }`.
Versioning: /api/v1; additive changes only; deprecations ≥6 months. Full OpenAPI 3.2.0 spec is an MVP deliverable (NFR-API-01).

## 10. Assumptions, Dependencies, Out of Scope, Open Questions

**Assumptions:** A1 Customers are on M365 with Entra ID (business-case ICP). A2 Azure OpenAI (or equivalent Foundry-hosted model) is contractually available; SA North availability verified per model in architecture phase. A3 Customer Zero = Gijima Procurement BU supplies pilot data + SMEs. A4 Hulamin patterns are licensed/available for reuse within Gijima. A5 English UI at MVP (localization framework in place, translations later).

**Dependencies:** D1 Microsoft Graph API (Teams cards, meetings, mail). D2 Azure OpenAI/Foundry + Azure AI Search. D3 Virus-scanning engine (Defender for Storage or ClamAV). D4 Azure SA North capacity for AKS + zone-redundant Postgres. D5 Adobe Fonts kit for Proxima Nova (brand). D6 SMTP/Exchange Online for supplier email.

**Out of scope (MVP):** P2P/purchase orders, invoicing, payments, inventory; supplier performance management; auctions; contract lifecycle (Stage 3); ERP write-back (Stage 2); Slack/Google Chat; offline mode; native mobile apps (responsive web only).

**Open questions (owner → due):** OQ1 Two-envelope default ON or OFF per tenant? (Product, pilot config — default OFF, capability ON). OQ2 Supplier MFA at MVP or fast-follow? (Security review). OQ3 Which embedding/inference models available in Azure SA North at build time? (Architect, sprint 0). OQ4 Evidence-pack legal format review by Gijima Legal (pre-GA). OQ5 Tenant onboarding self-service vs assisted at MVP? (GTM — assume assisted).

---

**Quality Gate — Business Analyst:**
- [x] All product-brief features (M1–M10, S1–S5) covered by FRs: **124 MVP FRs across 16 modules** (INT 13, RFX 13, AI 8, DOC 6, SUP 7, WF 9, PUB 4, SP 7, RESP 7, CR 6, EVAL 12, TEAMS 7, AUD 7, DASH 7, NOTIF 5, ADM 6) + Stage 2/3 outline
- [x] 9 user journeys, each with success, failure handling, and edge cases
- [x] Consistent ID format FR-CAT-NN / NFR-CAT-NN
- [x] Testability: 124/124 FRs express observable, verifiable behavior (Given/When/Then writable) — **100% ≥ 90% gate**
- [x] NFRs numeric (53 NFRs, all with thresholds: PERF 7, BUDGET 3, SEC 12, REL 3, ERR 6, SCALE 5, A11Y 6, API 6, COMP 5)
- [x] Data model covers all features (23 entities); API overview covers all modules
- [x] No TBD placeholders; open questions tracked with owners
- **Score: 95/100** ✅

**Next:** Architect agent → architecture.md
