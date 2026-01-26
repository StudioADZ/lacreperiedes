import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { adminStats, adminVerify, adminClaim } from "../services/edge/adminScan";

const SESSION_DURATION = 30 * 60 * 1000;

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [result, setResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");

  const storedPassword = useRef<string>("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.timestamp < SESSION_DURATION) {
        storedPassword.current = parsed.password;
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem("admin_auth");
      }
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);

    const res = await adminStats(password);

    if (!res.ok) {
      setAuthError(res.error || "Mot de passe incorrect");
      setIsLoading(false);
      return;
    }

    storedPassword.current = password;
    sessionStorage.setItem(
      "admin_auth",
      JSON.stringify({ password, timestamp: Date.now() })
    );
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const handleVerify = async (code: string) => {
    if (!storedPassword.current) return;

    setIsLoading(true);
    setResult(null);

    const res = await adminVerify(code, storedPassword.current);

    if (res.ok) {
      const data: any = res.data;
      setResult(data);

      if (data.valid && !data.claimed) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#b8860b", "#daa520", "#ffd700", "#228b22"],
        });
      }
    } else {
      setResult({
        valid: false,
        error: "connection_error",
        message: res.error,
      });
    }

    setIsLoading(false);
  };

  const handleClaim = async () => {
    if (!manualCode || !storedPassword.current) return;

    setIsLoading(true);

    const res = await adminClaim(manualCode, storedPassword.current);

    if (res.ok) {
      const data: any = res.data;
      setResult(data);
    } else {
      setResult({
        valid: false,
        error: "connection_error",
        message: res.error,
      });
    }

    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Admin</h1>
          <input
            type="password"
            className="w-full p-2 border rounded"
            placeholder="Mot de passe admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {authError && (
            <p className="text-sm text-red-600 text-center">{authError}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full p-2 bg-black text-white rounded"
          >
            {isLoading ? "Connexion..." : "Connexion"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          placeholder="Code à vérifier"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
        />
        <button
          onClick={() => handleVerify(manualCode)}
          disabled={isLoading}
          className="p-2 bg-blue-600 text-white rounded"
        >
          Vérifier
        </button>
        <button
          onClick={handleClaim}
          disabled={isLoading}
          className="p-2 bg-green-600 text-white rounded"
        >
          Valider
        </button>
      </div>

      {result && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
