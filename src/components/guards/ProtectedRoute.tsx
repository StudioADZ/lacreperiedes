import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
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
  const location = useLocation();
  const [adminState, setAdminState] = useState<AdminCheckState>("idle");
  const adminRequestRef = useRef(0);

  useEffect(() => {
    if (!requireAdmin) {
      setAdminState("idle");
      return;
    }

    if (isLoading) return;

    const userId = user?.id;
    if (!userId) {
      adminRequestRef.current += 1;
      setAdminState("denied");
      return;
    }

    const requestId = ++adminRequestRef.current;
    setAdminState("checking");

    void (async () => {
      try {
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });

        if (requestId !== adminRequestRef.current) return;

        if (error) {
          console.error("[ProtectedRoute] has_role error:", error);
          setAdminState("denied");
          return;
        }

        setAdminState(data === true ? "granted" : "denied");
      } catch (error) {
        if (requestId !== adminRequestRef.current) return;
        console.error("[ProtectedRoute] admin check failed:", error);
        setAdminState("denied");
      }
    })();
  }, [requireAdmin, isLoading, user?.id]);

  if (isLoading) return <FullScreenLoader />;

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (requireAdmin) {
    if (!isAuthenticated) {
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    if (adminState === "idle" || adminState === "checking") {
      return <FullScreenLoader />;
    }

    if (adminState === "denied") {
      return <Navigate to={redirectTo} replace state={{ from: location, reason: "admin_denied" }} />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
