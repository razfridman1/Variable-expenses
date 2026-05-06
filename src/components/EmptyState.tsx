import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="card flex flex-col items-center text-center py-10 px-6 gap-3">
      <div className="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center text-muted">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
