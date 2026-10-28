import { useEffect } from "react";
import { Icon } from "./Icon";

export interface ToastMessage {
  id: number;
  message: string;
  tone: "success" | "info" | "error";
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      <span className="toast-icon">
        <Icon
          name={toast.tone === "error" ? "alert" : toast.tone === "info" ? "clock" : "check"}
          size={16}
        />
      </span>
      <span>{toast.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
