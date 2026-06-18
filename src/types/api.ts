// TypeScript types mirroring the UNI-EDU backend (../UNI-EDU-Backend).
// Generated from the controllers + Application-layer DTOs. Responses are
// serialized as camelCase to the client, so these use camelCase field names.
//
// Where the backend serializes enums as strings, we keep the field as `string`
// (the project's TS config is intentionally loose) and document the known
// values in comments.

/** Every backend response is wrapped in this envelope (ApiResponse<T>). */
export interface ApiEnvelope<T> {
  statusCode: number;
  message: string | null;
  data: T;
}

/** PagedResult<T> — shape of `data` for list/paged endpoints. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ===========================================================================
// Enums (string values as serialized) — documented for reference.
// ===========================================================================
// UserRole:        Admin | Tutor | Parent | Student   (claim is buggy — see roleRoutes.ts)
// TutorType:       tutor | teacher
// ExamType:        tutor-test | student-test
// CreatorType:     ai | tutor | admin
// ClassStatus:     searching | active | completed | paused | cancelled
// SessionStatus:   scheduled | in_progress | completed | missed | cancelled | pending_confirm
// ExamStatus:      draft | open | closed | hidden
// WalletTxStatus:  pending | completed | failed
// WalletTxType:    deposit | escrow_in | escrow_release | withdrawal | refund | platform_fee
// WithdrawalStatus: pending | approved | rejected
// ClassFormat:     online | offline | hybrid
// DifficultyLevel: easy | medium | hard
// QuestionType:    multiple-choice | essay
// EscrowStatus:    pending | in_progress | completed | refunded

// ===========================================================================
// Auth
// ===========================================================================
export interface LoginRequest {
  email: string;
  password: string;
}

/** TokenResponse */
export interface LoginResponse {
  accessToken: string;
}
export type TokenResponse = LoginResponse;

export interface BaseRegister {
  email: string;
  password: string;
  phoneNumber: string;
  fullname: string;
}
export interface StudentRegister extends BaseRegister {
  school: string;
  grade: number;
}
export interface TutorRegister extends BaseRegister {
  gender: string;
  studentIdNumber?: string | null;
  degree: string;
}
export type ParentRegister = BaseRegister;

/** Claims we read out of the decoded JWT. `role` is the RAW (buggy) claim. */
export interface JwtClaims {
  nameid: string;
  email: string;
  role: string; // raw claim — see roleRoutes.ts for the correction map
  exp: number;
  iat: number;
  nbf: number;
  jti?: string;
}

// ===========================================================================
// Users
// ===========================================================================
export interface CheckPhoneUserRequest {
  phoneNumber: string;
}
export interface CheckPhoneUserResponse {
  phoneNumber: string;
  isExist: boolean;
}

/** CurrentUserResponse — GET /Users/me (shared identity for layouts). */
export interface CurrentUserResponse {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  role: string; // admin | tutor | teacher | student | parent
  status: string;
  createdAt: string;
  tutor?: { avatarUrl?: string | null } | null;
  student?: unknown;
  parent?: unknown;
}

// ===========================================================================
// Subjects
// ===========================================================================
export interface SubjectResponse {
  id: string;
  name: string;
}

// ===========================================================================
// Tutors
// ===========================================================================
export interface AvailableSlotDto {
  day: string;
  time: string;
}
/** GET /Students/me/ai-slots/{tutorId} — AI-ranked study slots with a reason per slot. */
export interface AiSlotSuggestion {
  day: string;
  time: string;
  reason: string;
  score: number;
}
/** POST /Exams/generate-with-ai — AI-generate + persist an exam/exercise. */
export interface GenerateExamWithAiRequest {
  subjectId: string;
  title: string;
  topic?: string;
  grade?: number | null;
  difficulty: string; // easy | medium | hard
  questionCount: number;
  duration: number; // minutes
}
export interface AvailabilityDayDto {
  day: string;
  slots: string[];
}

/** TutorListingResponse — item of GET /tutors. */
export interface TutorListItem {
  id: string;
  name: string;
  avatar: string;
  subjects: string[];
  rating: number;
  totalReviews: number;
  totalSessions: number;
  yearsExperience: number;
  hourlyRate: number;
  location: string;
  verified: boolean;
  bio: string;
  school: string;
  degree: string;
  type: string;
  availableSlots?: AvailableSlotDto[] | null;
  certificates?: string[] | null;
  introVideoUrl?: string | null;
  teachingStyle?: string | null;
  achievements?: string[] | null;
}
export type TutorAvailableSlot = AvailableSlotDto;

/** TutorReviewResponse */
export interface TutorReviewItem {
  id: number;
  classId: string;
  className: string;
  studentName: string;
  parentName: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
  subject: string;
}
export type TutorReviewResponse = TutorReviewItem;

/** TutorProfileResponse — GET /tutors/{id}. */
export interface TutorProfileResponse {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  subjects: string[];
  bio: string;
  school: string;
  degree: string;
  degreeVerified: boolean;
  transcriptVerified: boolean;
  videoUrl: string;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  testPassRate: number;
  hourlyRate: number;
  availability: AvailabilityDayDto[];
  joinDate: string;
  location: string;
  teachingStyle: string;
  achievements: string[];
  certificates?: string[];
  role: string;
  type?: string; // "tutor" | "teacher" (from Tutor.TutorType)
  isVerified?: boolean;
  yearsExperience?: number | null;
  currentSchool?: string | null;
  platformFeeRate: number;
  reviews: TutorReviewResponse[];
}

export interface TutorListQuery {
  Search?: string;
  Subject?: string;
  Type?: string;
  MinPrice?: number;
  MaxPrice?: number;
  Page?: number;
}

export interface BankAccount {
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
}
export type SaveBankAccountRequest = BankAccount;
export type BankAccountResponse = BankAccount;

export interface UpdateAvailabilityRequest {
  slots: AvailableSlotDto[];
}

/** UpdateTutorProfileRequest — body of PUT /Tutors/me/profile. */
export interface UpdateTutorProfileRequest {
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  school?: string | null;
  degree?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
  teachingStyle?: string | null;
  introVideoUrl?: string | null;
  tutorType?: string | null; // tutor | teacher
  certificates?: string[] | null;
  achievements?: string[] | null;
  subjectIds?: string[] | null;
}

// ===========================================================================
// Classes
// ===========================================================================
export interface WeeklySlotDto {
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // "HH:mm:ss"
  endTime: string;
}

export interface CreateClassRequest {
  studentId: string;
  tutorId: string;
  subjectId: string;
  name: string;
  startDate: string; // ISO date
  totalSessions: number;
  weeklySlots: WeeklySlotDto[];
  format: string; // online | offline | hybrid
  fee: number;
}

export interface UpdateClassRequest {
  name?: string | null;
  status?: string | null;
  subjectId?: string;
  tutorId?: string;
  studentId?: string;
  format?: string;
  fee?: number;
  totalSessions?: number;
}

/** ClassListItemResponse — item of GET /classes. */
export interface ClassItem {
  id: string;
  name: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  subject: string;
  tutorName: string;
  tutorAvatar: string;
  studentName: string;
  status: string;
  format: string;
  fee: number;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  createdAt: string;
  weeklySlots: WeeklySlotDto[];
}

/** ClassDetailResponse — GET /classes/{id}. */
export interface ClassDetailResponse {
  id: string;
  name: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  subject: string;
  tutorName: string;
  tutorAvatar: string;
  tutorType: string;
  studentName: string;
  studentAvatar: string;
  parentName: string;
  format: string;
  fee: number;
  status: string;
  weeklySlots: WeeklySlotDto[];
  totalSessions: number;
  completedSessions: number;
  escrowAmount: number;
  escrowReleased: number;
  escrowStatus: string;
  createdAt: string;
  startDate: string;
  sessions: SessionResponse[];
  materials: MaterialResponse[];
}
/** ClassResponse — returned by POST /classes (no list-only fields). */
export type ClassResponse = ClassDetailResponse;

export interface ClassListQuery {
  Status?: string;
  Page?: number;
}

// ===========================================================================
// Class requests (student "looking for a tutor" job board)
// ===========================================================================
export interface ClassRequestResponse {
  id: string;
  studentId: string;
  studentName: string;
  school: string;
  grade: number;
  subjectId: string;
  subject: string;
  preferredSchedule?: string | null;
  budget?: number | null;
  note?: string | null;
  status: string; // open | assigned | cancelled
  assignedTutorName?: string | null;
  createdAt: string;
}
export interface CreateClassRequestRequest {
  subjectId: string;
  grade: number;
  preferredSchedule?: string;
  budget?: number;
  note?: string;
  /** Only sent when a Parent posts on behalf of a linked child. */
  studentId?: string;
}
/** A tutor accepts a request with a passing AI-test attempt id (>=80%, per-class). */
export interface AcceptClassRequestRequest {
  aiTestAttemptId: string;
}

// ===========================================================================
// AI qualification test (tutor takes it to accept a class/student)
// ===========================================================================
export interface AiTestQuestionDto {
  index: number;
  content: string;
  options: string[];
}
export interface AiTestResponse {
  attemptId: string;
  subjectId: string;
  subject: string;
  grade?: number | null;
  passThreshold: number;
  questions: AiTestQuestionDto[];
}
export interface AiTestResultResponse {
  attemptId: string;
  score: number; // percent 0-100
  correctCount: number;
  total: number;
  passed: boolean;
  passThreshold: number;
}

// ===========================================================================
// Tutor-post applications (student "đăng ký học" on a tutor's post)
// ===========================================================================
export interface TutorPostApplicationResponse {
  id: string;
  tutorPostId: string;
  studentName: string;
  subjectId: string;
  subject: string;
  status: string;
  createdAt: string;
}
export interface AcceptApplicationRequest {
  aiTestAttemptId: string;
}
export interface ClassRequestListQuery {
  Search?: string;
  Subject?: string;
  Page?: number;
}

// ===========================================================================
// Tutor posts (tutor "looking for students" job board)
// ===========================================================================
export interface TutorPostResponse {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string | null;
  rating: number;
  subjectId: string;
  subject: string;
  gradeLevels?: string | null;
  hourlyRate?: number | null;
  preferredSchedule?: string | null;
  note?: string | null;
  status: string; // open | closed
  createdAt: string;
}
export interface CreateTutorPostRequest {
  subjectId: string;
  gradeLevels?: string;
  hourlyRate?: number;
  preferredSchedule?: string;
  note?: string;
}
export interface TutorPostListQuery {
  Search?: string;
  Subject?: string;
  Page?: number;
}

// ===========================================================================
// Sessions
// ===========================================================================
export interface SessionResponse {
  id: string;
  classId: string;
  startAt: string;
  endAt: string;
  status: string;
  format: string;
  startedAt?: string | null;
  endedAt?: string | null;
  content?: string | null;
  notes?: string | null;
  homework?: string | null;
  homeworkFiles: string[];
  rating?: number | null;
  ratingComment?: string | null;
  absenceReason?: string | null;
  absenceRequestedBy?: string | null;
  absenceApproved?: boolean | null;
}

export interface EndSessionRequest {
  content: string;
  notes?: string | null;
  homework?: string | null;
  homeworkFiles?: string[] | null;
}
/** Tutor adds a teaching session to a class. */
export interface CreateSessionRequest {
  startAt: string; // ISO datetime
  endAt: string;   // ISO datetime
  format: string;  // online | offline | hybrid
}
export interface RateSessionRequest {
  rating: number;
  comment?: string | null;
}
export interface CreateAbsenceRequest {
  reason: string;
  requestedBy: string; // "tutor" | "student"
}

// ===========================================================================
// Class materials
// ===========================================================================
export interface MaterialResponse {
  id: string;
  classId: string;
  name: string;
  type: string; // pdf | doc | image | video | link
  url: string;
  size?: string | null;
  uploadedAt: string;
}
export interface CreateMaterialRequest {
  name: string;
  type: string;
  url: string;
  size?: string | null;
}

// ===========================================================================
// Exams
// ===========================================================================
export interface ExamListItemResponse {
  id: number;
  title: string;
  subjectId: string;
  subject: string;
  duration: number;
  questionCount: number;
  fee: number;
  year: number;
  status: string;
  difficulty: string;
  type: string;
  createdBy: string;
  aiProctoring: boolean;
  startDate?: string | null;
  endDate?: string | null;
  maxAttemptsPerUser: number;
  scoreScale: number;
  attempts: number;
  createdAt: string;
}
export interface ExamDetailResponse extends ExamListItemResponse {
  description: string;
  questions: QuestionResponse[];
}
export interface CreateExamRequest {
  subjectId: string;
  title: string;
  description: string;
  duration: number;
  type?: string;
  createdBy?: string;
  status?: string;
  difficulty?: string;
  fee: number;
  year: number;
  startDate?: string | null;
  endDate?: string | null;
  maxAttemptsPerUser?: number;
  scoreScale?: number;
  aiProctoring: boolean;
  questionIds?: number[] | null;
}
export interface UpdateExamRequest {
  subjectId: string;
  title: string;
  description: string;
  duration: number;
  type: string;
  status: string;
  difficulty: string;
  fee: number;
  year: number;
  startDate?: string | null;
  endDate?: string | null;
  maxAttemptsPerUser: number;
  scoreScale: number;
  aiProctoring: boolean;
}
export interface SetExamQuestionsRequest {
  questionIds: number[];
}
export interface ExamAnswerDto {
  questionId: number;
  selectedOption: number;
}
export interface SubmitExamRequest {
  answers: ExamAnswerDto[];
}
export interface SubmissionResponse {
  id: number;
  examId: number;
  examTitle: string;
  userId: string;
  studentName: string;
  score: number;
  scoreScale: number;
  totalQuestions: number;
  correctCount: number;
  submissionDate: string;
  aiFeedback?: string | null;
}
export interface ExamListQuery {
  Search?: string;
  SubjectId?: string;
  Status?: string;
  Page?: number;
}

// ===========================================================================
// Questions
// ===========================================================================
export interface QuestionResponse {
  id: number;
  subjectId: string;
  subject: string;
  content: string;
  type: string;
  difficulty: string;
  options: string[];
  correctAnswer?: number | null;
  topic?: string | null;
  standard?: string | null;
  createdAt: string;
}
export interface CreateQuestionRequest {
  subjectId: string;
  content: string;
  type?: string;
  difficulty?: string;
  options: string[];
  correctAnswer: number;
  topic?: string | null;
  standard?: string | null;
}
export interface UpdateQuestionRequest {
  subjectId: string;
  content: string;
  type: string;
  difficulty: string;
  options: string[];
  correctAnswer: number;
  topic?: string | null;
  standard?: string | null;
}
export interface QuestionListQuery {
  Search?: string;
  SubjectId?: string;
  Difficulty?: string;
  Page?: number;
}

// ===========================================================================
// Wallet
// ===========================================================================
export interface Wallet {
  balance: number;
  escrowBalance?: number | null;
}
export type WalletResponse = Wallet;

/** TransactionResponse */
export interface WalletTransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  classId?: string | null;
  relatedId?: string | null;
  childId?: string | null;
  paymentMethod?: string | null;
}

export interface DepositRequest {
  amount: number;
  method: string; // momo | vnpay | bank
}
export interface DepositResponse {
  transactionId: string;
  payUrl: string;
  status: string;
}

// DEV/DEMO test-deposit flow: no Method field (server forces Method = "test") and no
// gateway redirect. Two steps — POST /Wallet/deposit-test then confirm — credit the
// wallet directly so the balance can be exercised without Momo/VNPay sandbox config.
export interface DepositTestRequest {
  amount: number;
}
export interface TestDepositConfirmResponse {
  transactionId: string;
  status: string;
  balance: number;
}
export interface CreateWithdrawalRequest {
  amount: number;
  method: string;
  bankAccount?: string | null;
  bankName?: string | null;
  note?: string | null;
}
export interface WithdrawalResponse {
  id: string;
  amount: number;
  method: string;
  bankName: string;
  bankAccount: string;
  note?: string | null;
  status: string;
  requestDate: string;
}

// ===========================================================================
// Students (own profile / report)
// ===========================================================================
/** StudentProfileResponse — GET /Students/me. */
export interface StudentProfileResponse {
  id: string;
  fullName: string;
  school?: string | null;
  grade: number;
  parentId?: string | null;
}
/** Body of PUT /Students/me. */
export interface UpdateStudentProfileRequest {
  fullName?: string | null;
  school?: string | null;
  grade?: number | null;
}
/** StudentReportResponse — GET /Students/me/report. */
export interface StudentReportResponse {
  examsTaken: number;
  avgScore: number;
  activeClasses: number;
  completedSessions: number;
}

// ===========================================================================
// Parents
// ===========================================================================
/** ParentReportResponse — GET /Parents/me/report. */
export interface ParentReportResponse {
  childrenCount: number;
  activeClasses: number;
  totalSpent: number;
  avgChildScore: number;
}

/** ParentLinkRequestResponse — a pending parent-link request shown to the student. */
export interface ParentLinkRequestResponse {
  id: string;
  parentName: string;
  status: string; // pending | approved | rejected
  createdAt: string;
}

/** StudentSummaryResponse — GET /parents/me/children. */
export interface ParentChild {
  id: string;
  fullName: string;
  school: string;
  grade: number;
}

/** GET /Parents/me/children/{childId}/progress — real monthly + per-subject analytics. */
export interface MonthlyProgressPoint {
  month: string;            // "MM/yyyy"
  gpa: number;              // 0–10
  attendance: number;       // 0–100 %
  sessionsCompleted: number;
  homeworkRate: number;     // 0–100 %
}
export interface SubjectPerformance {
  subject: string;
  score: number;            // 0–10
  target: number;           // 8.0
  homeworkRate: number;     // 0–100 %
  participationRate: number;// 0–100 %
  trend: "up" | "down" | "flat";
}
export interface ChildProgressAnalyticsResponse {
  monthlyProgress: MonthlyProgressPoint[];
  subjectScores: SubjectPerformance[];
}

/** GET /Office/rooms — physical room inventory + occupancy. */
export interface RoomAvailabilityDto {
  id: string;
  name: string;
  capacity: number;
  type: string;
  building?: string | null;
  isOccupied: boolean;
}
export interface RoomInventorySummary {
  total: number;
  free: number;
  occupied: number;
  occupancyRate: number;
}
export interface RoomInventoryResponse {
  rooms: RoomAvailabilityDto[];
  summary: RoomInventorySummary;
}

// ===========================================================================
// Admin (Admin role)
// ===========================================================================
export interface AdminUserResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string; // approved | pending | rejected | suspended
  avatar?: string | null;
  school?: string | null;
  bio?: string | null;
  grade?: number | null;
  gender?: string | null;
  degree?: string | null;
  studentIdNumber?: string | null;
  createdAt: string;
}
export interface AuditLogResponse {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}
export interface AdminUserListQuery {
  Search?: string;
  Role?: string;
  Status?: string;
  Page?: number;
}
export interface RejectUserRequest {
  reason: string;
}

// ===========================================================================
// Finance (Admin role)
// ===========================================================================
export interface AdminTransactionResponse {
  id: string;
  userId: string;
  user: string;
  userRole: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  date: string;
}
export interface WithdrawalAdminResponse {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string | null;
  amount: number;
  method: string;
  bankName: string;
  bankAccount: string;
  note?: string | null;
  status: string;
  requestDate: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  totalWithdrawn: number;
}
export interface ReviewWithdrawalRequest {
  note?: string;
}
export interface AdminTransactionListQuery {
  Type?: string;
  Status?: string;
  Page?: number;
}
export interface WithdrawalListQuery {
  Status?: string;
  Page?: number;
}

/** MonthlyAmount — a { month, amount } point used by report time-series. */
export interface MonthlyAmount {
  month: string; // "yyyy-MM"
  amount: number;
}
/** FinanceReportResponse — GET /Finance/reports. */
export interface FinanceReportResponse {
  totalRevenue: number;
  totalWithdrawn: number;
  totalRefunded: number;
  totalEscrow: number;
  monthlyRevenue: MonthlyAmount[];
}

// ===========================================================================
// Office (Admin role)
// ===========================================================================
export interface AttendanceResponse {
  id: string; // SessionID
  classId: string;
  className: string;
  tutor: string;
  student: string;
  date: string;
  time: string;
  status: string;
  parentConfirmed: boolean;
  officeConfirmed: boolean;
}
export interface IncidentResponse {
  id: string;
  classId: string;
  className: string;
  sessionId?: string | null;
  reporter: string;
  reporterRole: string;
  description: string;
  priority: string; // low | medium | high
  status: string; // pending | investigating | resolved
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}
export interface CreateIncidentRequest {
  classId: string;
  sessionId?: string | null;
  description: string;
  priority: string;
}
export interface ResolveIncidentRequest {
  resolution: string;
}
export interface AttendanceListQuery {
  Status?: string;
  Page?: number;
}
export interface IncidentListQuery {
  Status?: string;
  Page?: number;
}

/** OfficeReportResponse — GET /Office/reports. */
export interface OfficeReportResponse {
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  openIncidents: number;
  resolvedIncidents: number;
}

// ===========================================================================
// Chat (per class)
// ===========================================================================
export interface MessageResponse {
  id: string;
  classId: string;
  senderId: string;
  sender: string;
  senderName: string;
  message: string;
  timestamp: string;
  read: boolean;
}
export interface SendMessageRequest {
  message: string;
}

// ===========================================================================
// Class reviews
// ===========================================================================
export interface ReviewResponse {
  id: number;
  classId: string;
  tutorId: string;
  reviewerId: string;
  rating: number;
  comment: string;
  date: string;
}
export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

// ===========================================================================
// NEW endpoints (team shipped) — Notifications, Dashboards, Schedule,
// Conversations, Trials, Refunds, Settings, Appointments, Exam AI-config/stats.
// ===========================================================================
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // info | warning | success | error
  link?: string | null;
  read: boolean;
  createdAt: string;
}
export interface CreateNotificationRequest {
  userId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}

export interface TutorDashboard { activeClasses: number; upcomingSessions: number; monthlyEarnings: number; walletBalance: number; rating: number; totalReviews: number; pendingTrials: number; }
export interface StudentDashboard { activeClasses: number; upcomingSessions: number; walletBalance: number; avgScore: number; examsTaken: number; }
/** Daily learning streak. `currentStreak` reads 0 once the streak lapses; `longestStreak` is kept as an achievement. */
export interface StreakResponse { currentStreak: number; longestStreak: number; lastActivityDate: string | null; checkedInToday: boolean; }
export interface ParentDashboard { childrenCount: number; activeClasses: number; walletBalance: number; pendingConfirmations: number; }
export interface AdminDashboard { totalUsers: number; tutors: number; teachers: number; students: number; parents: number; pendingApprovals: number; totalClasses: number; activeClasses: number; totalExams: number; totalRevenue: number; pendingWithdrawals: number; openIncidents: number; }
export interface MonthlyCount { month: string; count: number; }
export interface TypeAmount { type: string; amount: number; }
/** AdminReportResponse — GET /Admin/reports. */
export interface AdminReportResponse { totalUsers: number; totalClasses: number; totalExams: number; totalRevenue: number; monthlyRevenue: MonthlyAmount[]; newUsersByMonth: MonthlyCount[]; revenueByType: TypeAmount[]; }
export interface FinanceDashboard { totalRevenue: number; pendingWithdrawals: number; totalEscrow: number; refundsPending: number; }
export interface OfficeDashboard { pendingAttendance: number; openIncidents: number; activeClasses: number; }
export interface ExamDashboard { totalExams: number; totalQuestions: number; totalAttempts: number; avgScore: number; }

export interface ConversationItem {
  classId: string;
  className: string;
  otherPartyName: string;
  otherPartyAvatar?: string | null;
  studentName?: string;
  parentName?: string | null;
  lastMessage?: string | null;
  lastTimestamp?: string | null;
  unreadCount: number;
}

export interface TrialItem {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentName: string;
  parentId?: string | null;
  subjectId: string;
  subjectName: string;
  requestedAt: string;
  goals?: string | null;
  currentLevel?: string | null;
  note?: string | null;
  status: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  completedAt?: string | null;
  feedback?: string | null;
  rating?: number | null;
  createdAt: string;
}
export interface CreateTrialRequest {
  tutorId: string;
  subjectId: string;
  requestedAt: string;
  goals?: string;
  currentLevel?: string;
  note?: string;
}

export interface RefundItem {
  id: string;
  classId: string;
  className: string;
  tutorName: string;
  studentName: string;
  amount: number;
  maxAmount: number;
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}
export interface CreateRefundRequest { amount: number; reason: string; }
export interface ReviewRefundRequest { note?: string; }

export interface SystemSettings {
  platformName: string;
  escrowPercent: number;
  escrowHoldDays: number;
  enableExams: boolean;
  enableChat: boolean;
  enablePayments: boolean;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  updatedAt?: string;
}

export interface AppointmentItem {
  id: string;
  title: string;
  description?: string | null;
  withName?: string | null;
  withUserId?: string | null;
  scheduledAt: string;
  status: string;
  notes?: string | null;
  createdAt: string;
}
export interface SaveAppointmentRequest {
  title: string;
  description?: string;
  withUserId?: string;
  scheduledAt: string;
  notes?: string;
}

export interface ExamAiConfig {
  proctoringEnabled: boolean;
  faceDetection: boolean;
  fullscreenRequired: boolean;
  copyPasteBlocked: boolean;
  tabSwitchLimit: number;
  autoGenerateEnabled: boolean;
  defaultDifficulty: string;
  updatedAt?: string;
}

export interface SaveSubjectRequest { name: string; }
export interface AiScheduleRequest { subject?: string; preferredDays?: string[]; sessionsPerWeek?: number; }

// Admin user CRUD (POST/PUT /Admin/users)
export interface AdminCreateUserRequest {
  email: string;
  password: string;
  phoneNumber: string;
  fullname: string;
  role: string; // student | parent | tutor
  school?: string;
  grade?: number;
  gender?: string;
  studentIdNumber?: string;
  degree?: string;
}
export interface AdminUpdateUserRequest {
  fullname?: string;
  phoneNumber?: string;
  email?: string;
  school?: string;
  grade?: number;
  gender?: string;
  degree?: string;
  studentIdNumber?: string;
  bio?: string;
}
