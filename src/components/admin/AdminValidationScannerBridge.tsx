import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CameraOff, Images, Loader2, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import QRScanner from "@/components/admin/QRScanner";

const setReactInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const extractCode = (decodedText: string) => {
  const verifyMatch = decodedText.match(/\/verify\/([A-Z0-9]+)/i);
  return (verifyMatch?.[1] ?? decodedText).trim().toUpperCase();
};

const AdminValidationScannerBridge = () => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [embeddedActive, setEmbeddedActive] = useState(false);
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeError, setNativeError] = useState("");
  const lastCodeRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (window.location.pathname !== "/admin") return;

    const connect = () => {
      const input = document.querySelector<HTMLInputElement>("#code");
      const manualCard = input?.closest(".rounded-3xl");

      if (!input || !manualCard?.parentElement) {
        setHost(null);
        setEmbeddedActive(false);
        return;
      }

      let scannerHost = document.getElementById("admin-validation-scanner-host");
      if (!scannerHost) {
        scannerHost = document.createElement("div");
        scannerHost.id = "admin-validation-scanner-host";
        manualCard.parentElement.insertBefore(scannerHost, manualCard);
      }
      setHost(scannerHost);
    };

    connect();
    const observer = new MutationObserver(connect);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.getElementById("admin-validation-scanner-host")?.remove();
    };
  }, []);

  const submitCode = useCallback((rawCode: string) => {
    const code = extractCode(rawCode);
    if (!code || code === lastCodeRef.current) return;
    lastCodeRef.current = code;
    setEmbeddedActive(false);

    const input = document.querySelector<HTMLInputElement>("#code");
    if (!input) return;

    setReactInputValue(input, code);
    window.setTimeout(() => {
      const card = input.closest(".rounded-3xl");
      const button = card?.querySelector<HTMLButtonElement>("button");
      button?.click();
    }, 80);
  }, []);

  const openNativeCamera = useCallback(() => {
    lastCodeRef.current = "";
    setNativeError("");
    fileInputRef.current?.click();
  }, []);

  const decodeNativeCapture = useCallback(async (file: File) => {
    setNativeLoading(true);
    setNativeError("");
    const readerId = `native-reward-reader-${Date.now()}`;
    const temporaryHost = document.createElement("div");
    temporaryHost.id = readerId;
    temporaryHost.style.display = "none";
    document.body.appendChild(temporaryHost);
    const scanner = new Html5Qrcode(readerId);

    try {
      const decodedText = await scanner.scanFile(file, true);
      if (navigator.vibrate) navigator.vibrate(150);
      submitCode(decodedText);
    } catch (error) {
      console.error("Native QR decode error:", error);
      setNativeError("Le QR n’a pas été reconnu. Reprenez la photo en cadrant le code de plus près.");
    } finally {
      try {
        await scanner.clear();
      } catch {
        // Le lecteur peut déjà être libéré après la lecture du fichier.
      }
      temporaryHost.remove();
      setNativeLoading(false);
    }
  }, [submitCode]);

  if (!host) return null;

  return createPortal(
    <section className="mb-4 overflow-hidden rounded-3xl border border-caramel/20 bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-4 text-white shadow-warm">
      <div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-butter">
          <ScanLine className="h-4 w-4" /> Scanner la récompense
        </div>
        <p className="mt-1 text-sm text-white/75">Utilisez directement la caméra arrière du téléphone. Le code sera contrôlé automatiquement.</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          onClick={openNativeCamera}
          disabled={nativeLoading}
          className="h-12 rounded-2xl bg-butter font-black text-espresso hover:bg-butter/90"
        >
          {nativeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {nativeLoading ? "Lecture du QR..." : "Ouvrir la caméra du téléphone"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            lastCodeRef.current = "";
            setNativeError("");
            setEmbeddedActive((value) => !value);
          }}
          className="h-12 rounded-2xl border-white/25 bg-white/10 font-black text-white hover:bg-white/15 hover:text-white"
        >
          {embeddedActive ? <CameraOff className="mr-2 h-4 w-4" /> : <Images className="mr-2 h-4 w-4" />}
          {embeddedActive ? "Fermer le scanner intégré" : "Scanner dans la page"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void decodeNativeCapture(file);
        }}
      />

      {nativeError && (
        <p className="mt-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/85">{nativeError}</p>
      )}

      {embeddedActive && (
        <div className="mx-auto mt-4 max-w-md overflow-hidden rounded-2xl bg-white text-foreground">
          <QRScanner isActive={embeddedActive} onScan={submitCode} mode="embedded" />
        </div>
      )}
    </section>,
    host,
  );
};

export default AdminValidationScannerBridge;
