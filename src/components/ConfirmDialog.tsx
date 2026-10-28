import { useId } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = "primary",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <Modal open onClose={onClose} labelledBy={titleId} size="sm">
      <div className="confirm-dialog">
        <button
          type="button"
          className="icon-button confirm-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" size={17} />
        </button>
        <span className={`confirm-icon confirm-${tone}`}>
          <Icon name={tone === "danger" ? "alert" : "check"} size={22} />
        </span>
        <h2 id={titleId}>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === "danger" ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
            data-autofocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
