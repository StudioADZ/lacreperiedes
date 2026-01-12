import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (code: string) => void;
  isActive: boolean;
}

const QRScanner = ({ onScan, isActive }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Cleanup when not active
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);

      try {
        // Create scanner instance
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            // Extract code from URL if it's a verify URL
            let code = decodedText;
            const verifyMatch = decodedText.match(/\/verify\/([A-Z0-9]+)/i);
            if (verifyMatch) {
              code = verifyMatch[1].toUpperCase();
            }
            
            // Vibrate on success if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            onScan(code);
          },
          () => {
            // Ignore scan errors (no QR found)
          }
        );
      } catch (err: unknown) {
        console.error('Scanner error:', err);
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        
        if (message.includes('Permission')) {
          setError('Autorisez l\'accès à la caméra pour scanner');
        } else if (message.includes('NotFound') || message.includes('not found')) {
          setError('Aucune caméra détectée');
        } else {
          setError('Impossible de démarrer la caméra');
        }
      } finally {
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isActive, onScan]);

  if (!isActive) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-espresso">
      {/* Scanner container */}
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full aspect-square"
        style={{ 
          maxWidth: '100%',
        }}
      />

      {/* Overlay with scanning frame */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corner markers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px]">
          {/* Top left */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
          {/* Top right */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
          {/* Bottom left */}
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
          {/* Bottom right */}
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
        </div>

        {/* Scanning line animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] overflow-hidden">
          <div 
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan"
            style={{
              animation: 'scan 2s linear infinite',
            }}
          />
        </div>
      </div>

      {/* Loading state */}
      {isStarting && (
        <div className="absolute inset-0 flex items-center justify-center bg-espresso/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-ivory">Démarrage de la caméra...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-espresso/90 p-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📷</span>
            </div>
            <p className="text-sm text-ivory/80">{error}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        
        #qr-reader video {
          border-radius: 0 !important;
          object-fit: cover !important;
        }
        
        #qr-reader__scan_region {
          background: transparent !important;
        }
        
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;