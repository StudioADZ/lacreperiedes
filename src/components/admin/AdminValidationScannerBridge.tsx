import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRScanner from "@/components/admin/QRScanner";

const setReactInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

const AdminValidationScannerBridge = () => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const lastCodeRef = useRef("");

  useEffect(() => {
    if (window.location.pathname !== "/admin") return;

    const connect = () => {
      const input = document.querySelector<HTMLInputElement>("#code");
      const manualCard = input?.closest(".rounded-3xl");

      if (!input || !manualCard?.parentElement) {
        setHost(null);
        setActive(false);
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

  const handleScan = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || code === lastCodeRef.current) return;
    lastCodeRef.current = code;
    setActive(false);

    const input = document.querySelector<HTMLInputElement>("#code");
    if (!input) return;

    setReactInputValue(input, code);
    window.setTimeout(() => {
      const card = input.closest(".rounded-3xl");
      const button = card?.querySelector<HTMLButtonElement>("button");
      button?.click();
    }, 80);
  }, []);

  if (!host) return null;

  return createPortal(
    <section className="mb-4 overflow-hidden rounded-3xl border border-caramel/20 bg-gradient-to-br from-espresso via-[#2b1811] to-caramel p-4 text-white shadow-warm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-butter">
            <ScanLine className="h-4 w-4" /> Scanner la récompense
          </div>
          <p className="mt-1 text-sm text-white/75">Cadrez le QR du gagnant. Le code sera contrôlé automatiquement.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            lastCodeRef.current = "";
            setActive((value) => !value);
          }}
          className={`h-11 rounded-2xl font-black ${active ? "bg-white/15 text-white hover:bg-white/20" : "bg-butter text-espresso hover:bg-butter/90"}`}
        >
          {active ? <><CameraOff className="mr-2 h-4 w-4" />Arrêter</> : <><Camera className="mr-2 h-4 w-4" />Scanner un QR</>}
        </Button>
      </div>

      {active && (
        <div className="mx-auto mt-4 max-w-md overflow-hidden rounded-2xl bg-white text-foreground">
          <QRScanner isActive={active} onScan={handleScan} mode="embedded" />
        </div>
      )}
    </section>,
    host,
  );
};

export default AdminValidationScannerBridge;
