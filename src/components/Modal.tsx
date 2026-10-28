import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  size = "md",
  className = "",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      const autofocus = panelRef.current?.querySelector<HTMLElement>(
        "[data-autofocus]",
      );
      (autofocus ?? panelRef.current)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-panel modal-${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panelRef}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

interface ModalHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  titleId?: string;
  onClose: () => void;
}

export function ModalHeader({
  eyebrow,
  title,
  description,
  titleId,
  onClose,
}: ModalHeaderProps) {
  return (
    <header className="modal-head">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId}>{title}</h2>
        {description ? <p className="modal-description">{description}</p> : null}
      </div>
      <button
        type="button"
        className="icon-button"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <Icon name="close" size={18} />
      </button>
    </header>
  );
}
