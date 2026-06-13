import { useQuery } from "@tanstack/react-query";
import * as svc from "@/services/dashboard";

export const useTutorDashboard = () => useQuery({ queryKey: ["dash-tutor"], queryFn: svc.getTutorDashboard });
export const useStudentDashboard = () => useQuery({ queryKey: ["dash-student"], queryFn: svc.getStudentDashboard });
export const useParentDashboard = () => useQuery({ queryKey: ["dash-parent"], queryFn: svc.getParentDashboard });
export const useAdminDashboard = () => useQuery({ queryKey: ["dash-admin"], queryFn: svc.getAdminDashboard });
export const useFinanceDashboard = () => useQuery({ queryKey: ["dash-finance"], queryFn: svc.getFinanceDashboard });
export const useOfficeDashboard = () => useQuery({ queryKey: ["dash-office"], queryFn: svc.getOfficeDashboard });
export const useExamDashboard = () => useQuery({ queryKey: ["dash-exam"], queryFn: svc.getExamDashboard });
