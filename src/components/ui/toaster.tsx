import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} data-slot="toast-instance">
          {/* Layout safe: texte flexible + actions à droite */}
          <div className="flex w-full items-start gap-3">
            <div className="grid flex-1 gap-1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>

            {/* Actions (si présent) + close */}
            <div className="flex shrink-0 items-center gap-2">
              {action ? <div className="shrink-0">{action}</div> : null}
              <ToastClose />
            </div>
          </div>
        </Toast>
      ))}

      <ToastViewport />
    </ToastProvider>
  );
}
