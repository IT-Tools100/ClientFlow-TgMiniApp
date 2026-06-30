import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { labels } from "@/lib/labels";

interface ConfirmDialogProps {
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmDialog({
  body,
  confirmLabel = labels.common.delete,
  onCancel,
  onConfirm,
  title
}: ConfirmDialogProps) {
  return (
    <div className="fade-enter fixed inset-0 z-[60] flex items-end bg-black/60 px-4 pb-24 backdrop-blur-sm">
      <GlassCard className="modal-enter mx-auto w-full max-w-md p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-red/90">
          Подтвердите действие
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-app-muted">{body}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="ghost">
            {labels.common.cancel}
          </Button>
          <Button
            className="border border-accent-red/35 bg-accent-red/[0.14] text-rose-50 hover:bg-accent-red/[0.2]"
            onClick={onConfirm}
            variant="ghost"
          >
            {confirmLabel}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
