import { apiClient } from "@/lib/apiClient";
import type { FinanceReportResponse, ParentReportResponse, StudentReportResponse } from "@/types/api";

export const getAdminReports = () => apiClient.get("/Admin/reports") as unknown as Promise<import("@/types/api").AdminReportResponse>;
export const getFinanceReports = () => apiClient.get("/Finance/reports") as unknown as Promise<FinanceReportResponse>;
export const getOfficeReports = () => apiClient.get("/Office/reports") as unknown as Promise<import("@/types/api").OfficeReportResponse>;
export const getStudentReport = () => apiClient.get("/Students/me/report") as unknown as Promise<StudentReportResponse>;
export const getParentReport = () => apiClient.get("/Parents/me/report") as unknown as Promise<ParentReportResponse>;
