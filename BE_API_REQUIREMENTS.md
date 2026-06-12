# Backend endpoints the frontend still needs

These are the gaps where the FE has working UI but **no backend endpoint exists**, so those screens are still on mock/seed data. Implementing the **P1** group lets us replace almost all remaining mock data.

Conventions (match existing API):
- Response envelope: `{ statusCode, message, data }`.
- Lists: `data = { items, total, page, pageSize, totalPages }`.
- Auth: JWT Bearer. "me" = the authenticated user. Staff portals (office/finance/exam-manager) are gated by the **Admin** role.

---

## P1 — high value (unblocks the most screens)

### 1. Notifications (all roles) — used by every dashboard/topbar
- `GET  /api/Notifications?page=` → `{ id, title, message, type: info|warning|success|error, read, timestamp }[]`
- `PATCH /api/Notifications/{id}/read`
- `PATCH /api/Notifications/read-all`

### 2. Dashboard aggregates (one per portal) — summary KPI cards
Return precomputed counts for the logged-in user/portal:
- `GET /api/Tutors/me/dashboard` → `{ activeClasses, upcomingSessions, monthlyEarnings, walletBalance, rating, totalReviews, pendingTrials }`
- `GET /api/Students/me/dashboard` → `{ activeClasses, upcomingSessions, walletBalance, avgScore, examsTaken }`
- `GET /api/Parents/me/dashboard` → `{ childrenCount, activeClasses, walletBalance, pendingConfirmations }`
- `GET /api/Admin/dashboard` → `{ totalUsers, pendingApprovals, activeClasses, totalRevenue, byRole:{tutors,students,parents} }`
- `GET /api/Finance/dashboard` → `{ totalRevenue, pendingWithdrawals, totalEscrow, refundsPending }`
- `GET /api/Office/dashboard` → `{ pendingAttendance, openIncidents, activeClasses }`
- `GET /api/Exams/dashboard` (exam-manager) → `{ totalExams, totalQuestions, totalAttempts, avgScore }`

### 3. My schedule (tutor & student calendars)
- `GET /api/me/sessions?from=&to=` → `SessionResponse[]` across **all** the user's classes (currently only `GET /api/classes/{id}/sessions` per class).

### 4. Chat conversation list (chat sidebar)
- `GET /api/me/conversations` → `{ classId, className, otherPartyName, otherPartyAvatar, lastMessage, lastTimestamp, unreadCount }[]`
  (per-class messages already exist; the sidebar needs this roll-up).

### 5. Trial bookings / booking requests (find-tutor → tutor inbox)
- `POST  /api/trials` `{ tutorId, studentName, studentGrade, subject, requestedDate, requestedTime }`
- `GET   /api/Tutors/me/trials` → `{ id, parentName, parentPhone, studentName, studentGrade, subject, requestedDate, requestedTime, status, feedback }[]`
- `PATCH /api/trials/{id}/confirm`
- `PATCH /api/trials/{id}/reject` `{ reason }`

### 6. Refunds (parent/tutor initiate → finance reviews)
- `POST  /api/Classes/{id}/refund-request` `{ amount, reason }`
- `GET   /api/Finance/refunds?status=&page=` → `{ id, classId, className, tutorName, amount, maxAmount, reason, status, createdAt }[]`
- `POST  /api/Finance/refunds/{id}/approve` `{ note? }`
- `POST  /api/Finance/refunds/{id}/reject`  `{ note }`

---

## P2 — completes the remaining portals

### 7. Admin settings
- `GET /api/Admin/settings` / `PUT /api/Admin/settings` →
  `{ platformName, escrowPercent, escrowHoldDays, enableExams, enableChat, enablePayments, maintenanceMode, emailNotifications, smsNotifications, pushNotifications, twoFactorAuth, sessionTimeout, maxLoginAttempts }`

### 8. Subjects management (admin) — only `GET /api/Subjects` exists today
- `POST /api/Subjects` `{ name }` · `PUT /api/Subjects/{id}` `{ name }` · `DELETE /api/Subjects/{id}`

### 9. Reviews moderation / my reviews
- `GET /api/me/reviews` → reviews the current student/parent wrote
- `GET /api/Reviews?status=&page=` (office moderation) + `PATCH /api/Reviews/{id}/hide`

### 10. Office extras
- `GET /api/Office/registrations` (+ `POST .../{id}/approve`, `.../{id}/reject`) — pending class/tutor registrations
- `GET /api/Office/appointments` (+ create/update/cancel)
- `POST /api/Office/ai-schedule` `{ constraints }` → generated schedule

### 11. Exam-manager analytics & config
- `GET /api/Exams/{id}/attempts` → per-attempt list / proctoring logs
- `GET /api/Exams/stats` → aggregate analytics (attempts, avg score, pass rate per exam)
- `GET /api/Exams/ai-config` / `PUT /api/Exams/ai-config` `{ proctoringEnabled, faceDetection, tabSwitchLimit, ... }`

### 12. Student availability (for matching)
- `GET /api/Students/me/availability` / `PUT /api/Students/me/availability` `{ slots:[{day,time}] }`
  (mirrors the existing tutor availability endpoints)

### 13. Reports / exports (if server-side wanted)
- `GET /api/Admin/reports`, `GET /api/Finance/reports`, `GET /api/Office/reports`, `GET /api/Students/me/report`, `GET /api/Parents/me/report`
  (currently computed client-side / mocked; only needed if you want server-generated reports or CSV/PDF export).

---

## Notes
- Items **not** in this list are already covered by existing endpoints and are being wired now (classes, sessions, materials, exams, questions, wallet, tutors, parents/children, admin users/audit, finance transactions/withdrawals, office attendance/incidents, chat messages, class reviews).
- One FE-side fix (no BE change): the public `/tutor-profile` route needs an `:id` param to call `GET /api/Tutors/{id}`.
- Please keep enum **string** values consistent with what the FE expects (e.g. class status `searching|active|completed|paused|cancelled`, session status `scheduled|in_progress|completed|missed|cancelled|pending_confirm`, attendance `pending|confirmed|reported|completed`).
