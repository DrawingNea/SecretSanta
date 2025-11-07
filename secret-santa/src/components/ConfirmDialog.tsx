export function ConfirmDialog({
  open,
  title = 'Ready to reveal?',
  message = 'You’re about to reveal your Secret Santa match. Make sure no one else is looking.',
  confirmText = 'Reveal now',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="modal">
        <h2 id="confirm-title">{title}</h2>
        <p className="muted">{message}</p>
        <div className="actions">
          <button className="btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
