# FE ↔ BE API integration coverage

Backend: `http://localhost:5115` (Swagger `/swagger/index.html`). 16 controllers / 72 endpoints.
Legend: ✅ wired to real API · 🟡 partially wired · ⛔ **no backend endpoint — stays on mock/seed**.

## Already wired (earlier work)
- Auth: Login, Register, RegisterTutor ✅ (`/login`, `/register/*`, `/logout`)
- FindTutor, StudentFindTutor, ParentFindTutor ✅ (`GET /Tutors`)
- TutorWallet, StudentWallet, ParentWallet ✅ (`GET /Wallet`, `/Wallet/transactions`, deposit/withdraw)
- AdminUsers ✅ (`/Admin/users` + approve/reject/suspend), AdminAudit ✅ (`/Admin/audit-logs`), AdminTransactions ✅ (`/Finance/transactions`)

## Tutor
- TutorClasses ✅ `GET /Classes`
- TutorClassDetail ✅ `GET /Classes/{id}` (+ sessions, materials)
- OnlineMeeting ✅ session `start`/`end`
- TutorChat ✅ `GET/POST /classes/{id}/messages`
- TutorReviews ✅ `GET /Tutors/{id}/reviews`
- TutorProfile ✅ `GET /Tutors/{id}` + `PUT /Tutors/me/availability` + bank-account
- TutorStudents 🟡 derived from `GET /Classes` (no dedicated students endpoint)
- TutorSchedule 🟡 derived from class sessions (no single schedule endpoint)
- TutorDashboard ⛔ summary widgets — no aggregate endpoint (compute from lists or seed)

## Student
- StudentClasses ✅ `GET /Classes`
- StudentClassDetail ✅ `GET /Classes/{id}`
- StudentTests ✅ `GET /Exams`
- StudentMockExam ✅ `GET /Exams/{id}` + `POST /Exams/{id}/submit`
- StudentResults ✅ `GET /Exams/me/submissions`
- StudentChat ✅ messages
- StudentReviews 🟡 `POST /classes/{id}/review` (no "my reviews" list endpoint)
- StudentSchedule / StudentAvailability 🟡 from class sessions
- StudentReport ⛔ no aggregate/report endpoint
- StudentDashboard ⛔ summary — no aggregate endpoint

## Parent
- ParentChildren ✅ `GET /Parents/me/children`
- ParentChat ✅ messages
- ParentReports 🟡 children + their classes (no report endpoint)
- ParentReviews 🟡 tutor/class reviews
- ParentSupport ⛔ no endpoint
- ParentDashboard ⛔ summary — no aggregate endpoint

## Admin
- AdminUsers ✅, AdminAudit ✅, AdminTransactions ✅
- AdminClasses ✅ `GET /Classes` + `PATCH /Classes/{id}` (status/name only)
- AdminApprovals → redirects to AdminUsers; AdminTests → redirects to AdminClasses
- AdminReports ⛔ no report endpoint
- AdminSettings ⛔ no settings endpoint
- AdminDashboard ⛔ summary — no aggregate endpoint

## Finance (Admin-role portal)
- FinanceTransactions ✅ `GET /Finance/transactions`
- FinancePayouts ✅ `GET /Finance/withdrawals` + approve/reject
- FinanceRefunds ⛔ no refund endpoint (only withdrawals)
- FinanceReconciliation ⛔ no endpoint
- FinanceReports ⛔ no report endpoint
- FinanceDashboard ⛔ summary — no aggregate endpoint

## Office (Admin-role portal)
- OfficeAttendance ✅ `GET /Office/attendance` + confirm
- OfficeIncidents ✅ `GET/POST /Office/incidents` + investigate/resolve
- OfficeClasses ✅ `GET /Classes`
- OfficeRegistrations ⛔ no endpoint
- OfficeAppointments / OfficeAISchedule ⛔ no endpoint
- OfficeReviews 🟡 no review-list endpoint
- OfficeReports / OfficeDashboard ⛔ summary — no aggregate endpoint

## Exam-manager (Admin-role portal)
- ExamManagerExams ✅ Exams CRUD + `PUT /Exams/{id}/questions`
- ExamManagerQuestions ✅ Questions CRUD
- ExamManagerStats ✅ `GET /Exams/{id}/submissions`
- ExamManagerAIConfig ⛔ no endpoint
- ExamManagerDashboard ⛔ summary — no aggregate endpoint

## Public
- TutorPublicProfile 🟡 `GET /Tutors/{id}` — the `/tutor-profile` route currently has no `:id` param; needs an id to fetch a specific tutor.

## Cross-cutting gaps (no backend endpoint anywhere) ⛔
- Notifications, dashboard aggregate stats, reports/exports, settings, support tickets,
  office registrations/appointments/AI-schedule, finance refunds/reconciliation, exam AI config.
  These remain on in-memory seed data until the backend exposes endpoints.
