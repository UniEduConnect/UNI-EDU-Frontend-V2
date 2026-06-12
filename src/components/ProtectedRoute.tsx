import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole, ROLE_ROUTE } from "@/lib/roleRoutes";

interface ProtectedRouteProps {
  /** Role this route group belongs to. */
  role: AppRole;
}

/**
 * Guards a role's route group:
 *  - not logged in        -> /login (remembering where they wanted to go)
 *  - logged in, wrong role -> their own dashboard
 *  - logged in, right role -> render nested routes
 *
 * `teacher` and `tutor` share the /tutor pages, so a tutor account may view
 * the tutor group regardless of which of the two it maps to.
 *
 * The backend has no separate office/finance/exam-manager user roles — those
 * staff portals are all gated by the Admin role server-side. So an `admin`
 * account is allowed into the admin/office/finance/exam-manager route groups.
 */
const ADMIN_PORTALS: AppRole[] = ["admin", "office", "finance", "exam-manager"];

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const { isAuthenticated, role: userRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const matches =
    userRole === role ||
    // tutor <-> teacher reuse the same /tutor pages
    ((role === "tutor" || role === "teacher") &&
      (userRole === "tutor" || userRole === "teacher")) ||
    // admin covers all staff portals (office/finance/exam-manager map to Admin)
    (userRole === "admin" && ADMIN_PORTALS.includes(role));

  if (!matches) {
    return <Navigate to={userRole ? ROLE_ROUTE[userRole] : "/"} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
