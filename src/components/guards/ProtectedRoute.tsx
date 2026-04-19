import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

type AdminCheckState = "idle" | "checking" | "granted" | "denied";

const FullScreenLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
    <p className="text-sm text-muted-foreground">Chargement...</p>
  </div>
);

/**
 * Route guard for authenticated and admin-only sections.
 *
 * Admin source of truth = `public.user_roles` table, queried via the
 * `has_role(_user_id, _role)` security-definer RPC. No client-side flags,
 * no hardcoded credentials.
 */
const ProtectedRoute = ({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [adminState, setAdminState] = useState<AdminCheckState>("idle");

  useEffect(() => {
    if (!requireAdmin) return;
    if (isLoading) return;
    if (!user) {
      setAdminState("denied");
      return;
    }

    let cancelled = false;
    setAdminState("checking");

    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("[ProtectedRoute] has_role error:", error);
          setAdminState("denied");
          return;
        }
        setAdminState(data === true ? "granted" : "denied");
      });

    return () => {
      cancelled = true;
    };
  }, [requireAdmin, isLoading, user]);

  // Auth still resolving
  if (isLoading) return <FullScreenLoader />;

  // Auth-only routes
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Admin routes
  if (requireAdmin) {
    if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
    if (adminState === "idle" || adminState === "checking") {
      return <FullScreenLoader />;
    }
    if (adminState === "denied") return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
