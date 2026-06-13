// Single source of truth for app roles and where each lands after login.
//
// The backend emits the JWT `role` claim as `user.Role.ToString()` (UserRole
// enum: Admin|Tutor|Parent|Student), which is CORRECT for accounts created via
// the /register endpoints — so this is an identity map.
//
// ⚠️ The originally-deployed RDS seed data had mis-ordered Role integers, which
// made the claim look permuted (parent→"Tutor", etc.). If you ever run the FE
// against that mis-seeded data, swap this back to the inversion map:
//   Tutor->parent, Parent->student, Student->tutor.

export type AppRole =
  | "admin"
  | "tutor"
  | "teacher"
  | "student"
  | "parent"
  | "office"
  | "finance"
  | "exam-manager";

/** Maps the JWT role claim to the application role (identity for /register accounts). */
const CLAIM_TO_ROLE: Record<string, AppRole> = {
  Admin: "admin",
  Tutor: "tutor",
  Parent: "parent",
  Student: "student",
  // Roles the backend may emit verbatim once more are supported:
  Teacher: "teacher",
  Office: "office",
  Finance: "finance",
  ExamManager: "exam-manager",
};

/** Dashboard base path for each role. `teacher` intentionally reuses tutor pages. */
export const ROLE_ROUTE: Record<AppRole, string> = {
  admin: "/admin",
  tutor: "/tutor",
  teacher: "/tutor",
  student: "/student",
  parent: "/parent",
  office: "/office",
  finance: "/finance",
  "exam-manager": "/exam-manager",
};

/** Resolve the real app role from a raw JWT claim string (case-insensitive). */
export function roleFromClaim(claim: string | undefined | null): AppRole | null {
  if (!claim) return null;
  const direct = CLAIM_TO_ROLE[claim];
  if (direct) return direct;
  const match = Object.keys(CLAIM_TO_ROLE).find(
    (k) => k.toLowerCase() === claim.toLowerCase(),
  );
  return match ? CLAIM_TO_ROLE[match] : null;
}

/** Dashboard path for a raw JWT claim; falls back to home. */
export function dashboardForClaim(claim: string | undefined | null): string {
  const role = roleFromClaim(claim);
  return role ? ROLE_ROUTE[role] : "/";
}
