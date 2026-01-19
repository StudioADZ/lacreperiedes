import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;

  /**
   * "embedded" = scanner dans la page (Html5Qrcode camera stream)
   * "native"   = ouvre la caméra native du téléphone (capture) puis decode l'image
   */
  mode?: "embedded" | "native";
}

/** Extrait un code si l’URL contient /verify/CODE */
const extractCode = (decodedText: string) => {
  let code = decodedText || "";
  const verifyMatch = decodedText.match(/\/verify\/([A-Z0-9]+)/i);
  if (verifyMatch) code = verifyMatch[1].toUpperCase();
  return code.trim();
};

const QRScanner = ({ onScan, isActive, mode = "embedded" }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  // ✅ évite de relancer le scanner si le parent recrée la fn onScan
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // ID unique (évite collisions si plusieurs montages)
  const readerId = useMemo(() => `qr-reader-${Math.random().toString(16).slice(2)}`, []);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        // stop peut throw si pas en cours: on catch
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {
      // ignore
    } finally {
      scannerRef.current = null;
    }
  }, []);

  // ===== MODE 1 : EMBEDDED (caméra dans la page) =====
  useEffect(() => {
    if (!isActive) {
      stopScanner();
      setError(null);
      setIsStarting(false);
      return;
    }

    if (mode !== "embedded") {
      // si on passe en mode native, on s’assure de stopper l’embedded
      stopScanner();
      return;
    }

    const start = async () => {
      setIsStarting(true);
      setError(null);

      try {
        const scanner = new Html5Qrcode(readerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            const code = extractCode(decodedText);

            // vibration si dispo
            if (navigator.vibrate) navigator.vibrate(150);

            onScanRef.current(code);
          },
          () => {
            // ignore scan errors (pas de QR)
          }
        );
      } catch (err: unknown) {
        console.error("Scanner error:", err);
        const message = err instanceof Error ? err.message : "Erreur inconnue";

        if (message.toLowerCase().includes("permission")) {
          setError("Autorisez l'accès à la caméra pour scanner");
        } else if (message.toLowerCase().includes("notfound") || message.toLowerCase().includes("not found")) {
          setError("Aucune caméra détectée");
        } else {
          setError("Impossible de démarrer la caméra");
        }
      } finally {
        setIsStarting(false);
      }
    };

    start();

    return () => {
      stopScanner();
    };
  }, [isActive, mode, readerId, stopScanner]);

  // ===== MODE 2 : NATIVE (caméra téléphone -> photo -> decode) =====
  const decodeFromFile = useCallback(async (file: File) => {
    setIsDecodingFile(true);
    setError(null);

    try {
      // Html5Qrcode sait decoder un fichier image via scanFile
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      const decodedText = await scanner.scanFile(file, true);
      const code = extractCode(decodedText);

      if (navigator.vibrate) navigator.vibrate(150);
      onScanRef.current(code);
    } catch (err) {
      console.error("Decode file error:", err);
      setError("Impossible de lire ce QR. Réessayez avec une photo plus nette.");
    } finally {
      // cleanup
      try {
        if (scannerRef.current) {
          await scannerRef.current.clear();
        }
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setIsDecodingFile(false);
    }
  }, [readerId]);

  const openNativeCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!isActive) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/10">
      {/* Header zone + actions */}
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">Scanner QR</div>

        {mode === "native" ? (
          <Button size="sm" onClick={openNativeCamera} disabled={isDecodingFile}>
            {isDecodingFile ? "Lecture..." : "Ouvrir caméra"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { /* rien ici: activation gérée par parent */ }}>
            Activer
          </Button>
        )}
      </div>

      {/* Zone scanner */}
      {mode === "embedded" ? (
        <div className="relative">
          <div
            id={readerId}
            className="w-full aspect-square"
            style={{ maxWidth: "100%" }}
          />

          {/* Overlay (cadre + ligne) */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/10" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] overflow-hidden">
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
            </div>
          </div>

          {/* Loading */}
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-white">Démarrage de la caméra...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Mode native : pas de stream intégré, on affiche une zone “placeholder”
        <div className="p-3">
          <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <div className="text-center px-6">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">Appuyez sur “Ouvrir caméra” pour scanner via la caméra du téléphone.</div>
            </div>
          </div>

          {/* input caché qui ouvre la caméra native */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // reset pour permettre de re-sélectionner le même fichier
              e.currentTarget.value = "";
              if (file) decodeFromFile(file);
            }}
          />
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-3">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Styles internes ciblés html5-qrcode */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(240px); }
          100% { transform: translateY(0); }
        }
        .animate-scan { animation: scan 2s linear infinite; }

        /* html5-qrcode tweaks */
        #${readerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${readerId}__dashboard {
          display: none !important;
        }
        #${readerId}__scan_region {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
