import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-16 text-center">
      <Icon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}
