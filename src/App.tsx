import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Login from "./pages/Login";
import FindTutor from "./pages/FindTutor";
import RegisterTutor from "./pages/RegisterTutor";
import ExamOnline from "./pages/ExamOnline";
import DemoPage from "./pages/DemoPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminTests from "./pages/admin/AdminTests";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReports from "./pages/admin/AdminReports";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminSettings from "./pages/admin/AdminSettings";
import TutorLayout from "./components/tutor/TutorLayout";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorClasses from "./pages/tutor/TutorClasses";
import TutorWallet from "./pages/tutor/TutorWallet";
import TutorStudents from "./pages/tutor/TutorStudents";
import TutorFindStudents from "./pages/tutor/TutorFindStudents";
import TutorReviews from "./pages/tutor/TutorReviews";
import TutorChat from "./pages/tutor/TutorChat";
import TutorProfile from "./pages/tutor/TutorProfile";
import TutorClassDetail from "./pages/tutor/TutorClassDetail";
import OnlineMeeting from "./pages/tutor/OnlineMeeting";
import TutorPublicProfile from "./pages/TutorPublicProfile";
import WalletDepositReturn from "./pages/WalletDepositReturn";
import TeacherLayout from "./components/teacher/TeacherLayout";
import StudentLayout from "./components/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentClasses from "./pages/student/StudentClasses";
import StudentClassDetail from "./pages/student/StudentClassDetail";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentTests from "./pages/student/StudentTests";
import StudentReport from "./pages/student/StudentReport";
import StudentChat from "./pages/student/StudentChat";
import StudentWallet from "./pages/student/StudentWallet";
import StudentReviews from "./pages/student/StudentReviews";
import StudentFindTutorPosts from "./pages/StudentFindTutorPosts";
import ParentLayout from "./components/parent/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentChat from "./pages/parent/ParentChat";
import ParentChildren from "./pages/parent/ParentChildren";
import ParentReports from "./pages/parent/ParentReports";
import ParentWallet from "./pages/parent/ParentWallet";
import ParentSupport from "./pages/parent/ParentSupport";
import ParentReviews from "./pages/parent/ParentReviews";
import OfficeLayout from "./components/office/OfficeLayout";
import OfficeDashboard from "./pages/office/OfficeDashboard";
import OfficeAttendance from "./pages/office/OfficeAttendance";
import OfficeIncidents from "./pages/office/OfficeIncidents";
import OfficeClasses from "./pages/office/OfficeClasses";
import OfficeAISchedule from "./pages/office/OfficeAISchedule";
import OfficeRegistrations from "./pages/office/OfficeRegistrations";
import OfficeAppointments from "./pages/office/OfficeAppointments";
import OfficeReports from "./pages/office/OfficeReports";
import OfficeReviews from "./pages/office/OfficeReviews";
import FinanceLayout from "./components/finance/FinanceLayout";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceTransactions from "./pages/finance/FinanceTransactions";
import FinancePayouts from "./pages/finance/FinancePayouts";
import FinanceReports from "./pages/finance/FinanceReports";
import FinanceRefunds from "./pages/finance/FinanceRefunds";
import FinanceReconciliation from "./pages/finance/FinanceReconciliation";
import ExamManagerLayout from "./components/exam-manager/ExamManagerLayout";
import ExamManagerDashboard from "./pages/exam-manager/ExamManagerDashboard";
import ExamManagerExams from "./pages/exam-manager/ExamManagerExams";
import ExamManagerAIConfig from "./pages/exam-manager/ExamManagerAIConfig";
import ExamManagerStats from "./pages/exam-manager/ExamManagerStats";
import ExamManagerQuestions from "./pages/exam-manager/ExamManagerQuestions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/find-tutor" element={<FindTutor />} />
                <Route path="/register-tutor" element={<RegisterTutor />} />
                <Route path="/exam-online" element={<ExamOnline />} />
                <Route path="/demo/:role" element={<DemoPage />} />
                <Route path="/tutor-profile" element={<TutorPublicProfile />} />
                <Route path="/wallet/deposit-return" element={<WalletDepositReturn />} />
                <Route element={<ProtectedRoute role="admin" />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="approvals" element={<Navigate to="/admin/users" replace />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="classes" element={<AdminClasses />} />
                  <Route path="tests" element={<Navigate to="/admin/classes" replace />} />
                  <Route path="transactions" element={<AdminTransactions />} />
                  <Route path="reports" element={<Navigate to="/admin" replace />} />
                  <Route path="audit" element={<AdminAudit />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
                </Route>
                <Route element={<ProtectedRoute role="tutor" />}>
                <Route path="/tutor" element={<TutorLayout />}>
                  <Route index element={<TutorDashboard />} />
                  <Route path="classes" element={<TutorClasses />} />
                  <Route path="classes/:classId" element={<TutorClassDetail />} />
                  <Route path="wallet" element={<TutorWallet />} />
                  {/* Lịch dạy merged into Lớp học — keep the old URL working for any stale links. */}
                  <Route path="schedule" element={<Navigate to="/tutor/classes" replace />} />
                  <Route path="students" element={<TutorStudents />} />
                  <Route path="find-students" element={<TutorFindStudents />} />
                  <Route path="reviews" element={<TutorReviews />} />
                  <Route path="chat" element={<TutorChat />} />
                  <Route path="profile" element={<TutorProfile />} />
                </Route>
                <Route path="/tutor/meeting/:sessionId" element={<OnlineMeeting />} />
                </Route>
                <Route element={<ProtectedRoute role="teacher" />}>
                <Route path="/teacher" element={<TeacherLayout />}>
                  <Route index element={<TutorDashboard />} />
                  <Route path="classes" element={<TutorClasses />} />
                  <Route path="classes/:classId" element={<TutorClassDetail />} />
                  <Route path="wallet" element={<TutorWallet />} />
                  <Route path="schedule" element={<Navigate to="/teacher/classes" replace />} />
                  <Route path="students" element={<TutorStudents />} />
                  <Route path="find-students" element={<TutorFindStudents />} />
                  <Route path="reviews" element={<TutorReviews />} />
                  <Route path="chat" element={<TutorChat />} />
                  <Route path="profile" element={<TutorProfile />} />
                </Route>
                <Route path="/teacher/meeting/:sessionId" element={<OnlineMeeting />} />
                </Route>
                <Route element={<ProtectedRoute role="student" />}>
                <Route path="/student" element={<StudentLayout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="classes" element={<StudentClasses />} />
                  <Route path="classes/:classId" element={<StudentClassDetail />} />
                  <Route path="schedule" element={<StudentSchedule />} />
                  <Route path="availability" element={<Navigate to="/student/classes" replace />} />
                  <Route path="tests" element={<StudentTests />} />
                  <Route path="mock-exam" element={<Navigate to="/student/classes" replace />} />
                  <Route path="results" element={<Navigate to="/student/classes" replace />} />
                  <Route path="report" element={<StudentReport />} />
                  <Route path="find-tutor" element={<Navigate to="/find-tutor" replace />} />
                  <Route path="tutor-posts" element={<StudentFindTutorPosts />} />
                  <Route path="reviews" element={<StudentReviews />} />
                  <Route path="wallet" element={<StudentWallet />} />
                  <Route path="chat" element={<StudentChat />} />
                </Route>
                <Route path="/student/meeting/:sessionId" element={<OnlineMeeting />} />
                </Route>
                <Route element={<ProtectedRoute role="parent" />}>
                <Route path="/parent" element={<ParentLayout />}>
                  <Route index element={<ParentDashboard />} />
                  <Route path="find-tutor" element={<Navigate to="/find-tutor" replace />} />
                  <Route path="tutor-posts" element={<StudentFindTutorPosts />} />
                  <Route path="chat" element={<ParentChat />} />
                  <Route path="children" element={<ParentChildren />} />
                  <Route path="reports" element={<ParentReports />} />
                  <Route path="reviews" element={<ParentReviews />} />
                  <Route path="wallet" element={<ParentWallet />} />
                  <Route path="support" element={<ParentSupport />} />
                </Route>
                </Route>
                <Route element={<ProtectedRoute role="office" />}>
                <Route path="/office" element={<OfficeLayout />}>
                  <Route index element={<OfficeDashboard />} />
                  <Route path="registrations" element={<OfficeRegistrations />} />
                  <Route path="attendance" element={<OfficeAttendance />} />
                  <Route path="incidents" element={<Navigate to="/office/attendance" replace />} />
                  <Route path="classes" element={<OfficeClasses />} />
                  <Route path="appointments" element={<OfficeAppointments />} />
                  <Route path="ai-schedule" element={<Navigate to="/office/appointments" replace />} />
                  <Route path="reviews" element={<OfficeReviews />} />
                  <Route path="reports" element={<OfficeReports />} />
                </Route>
                </Route>
                <Route element={<ProtectedRoute role="finance" />}>
                <Route path="/finance" element={<FinanceLayout />}>
                  <Route index element={<FinanceDashboard />} />
                  <Route path="transactions" element={<FinanceTransactions />} />
                  <Route path="payouts" element={<FinancePayouts />} />
                  <Route path="refunds" element={<FinanceRefunds />} />
                  <Route path="reconciliation" element={<FinanceReconciliation />} />
                  <Route path="reports" element={<FinanceReports />} />
                </Route>
                </Route>
                <Route element={<ProtectedRoute role="exam-manager" />}>
                <Route path="/exam-manager" element={<ExamManagerLayout />}>
                  <Route index element={<ExamManagerDashboard />} />
                  <Route path="exams" element={<ExamManagerExams />} />
                  <Route path="ai-config" element={<ExamManagerAIConfig />} />
                  <Route path="stats" element={<ExamManagerStats />} />
                  <Route path="questions" element={<ExamManagerQuestions />} />
                </Route>
                </Route>
                <Route path="/pricing" element={<PlaceholderPage title="Bảng giá" description="Trang bảng giá đang được cập nhật." />} />
                <Route path="/help" element={<PlaceholderPage title="Trung tâm trợ giúp" description="Trung tâm trợ giúp đang được xây dựng." />} />
                <Route path="/faq" element={<PlaceholderPage title="Câu hỏi thường gặp" description="Trang FAQ đang được cập nhật." />} />
                <Route path="/contact" element={<PlaceholderPage title="Liên hệ" description="Trang liên hệ đang được xây dựng." />} />
                <Route path="/refund" element={<PlaceholderPage title="Chính sách hoàn tiền" description="Chính sách hoàn tiền đang được cập nhật." />} />
                <Route path="/terms" element={<PlaceholderPage title="Điều khoản sử dụng" description="Điều khoản sử dụng đang được cập nhật." />} />
                <Route path="/privacy" element={<PlaceholderPage title="Chính sách bảo mật" description="Chính sách bảo mật đang được cập nhật." />} />
                <Route path="/gdpr" element={<PlaceholderPage title="GDPR" description="Trang GDPR đang được cập nhật." />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
