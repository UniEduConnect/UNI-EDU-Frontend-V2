import { apiClient } from "@/lib/apiClient";
import type {
  AdminDashboard, ExamDashboard, FinanceDashboard, OfficeDashboard,
  ParentDashboard, StudentDashboard, TutorDashboard,
} from "@/types/api";

export const getTutorDashboard = () => apiClient.get("/Tutors/me/dashboard") as unknown as Promise<TutorDashboard>;
export const getStudentDashboard = () => apiClient.get("/Students/me/dashboard") as unknown as Promise<StudentDashboard>;
export const getParentDashboard = () => apiClient.get("/Parents/me/dashboard") as unknown as Promise<ParentDashboard>;
export const getAdminDashboard = () => apiClient.get("/Admin/dashboard") as unknown as Promise<AdminDashboard>;
export const getFinanceDashboard = () => apiClient.get("/Finance/dashboard") as unknown as Promise<FinanceDashboard>;
export const getOfficeDashboard = () => apiClient.get("/Office/dashboard") as unknown as Promise<OfficeDashboard>;
export const getExamDashboard = () => apiClient.get("/Exams/dashboard") as unknown as Promise<ExamDashboard>;
