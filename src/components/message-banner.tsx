import { CheckCircle2, CircleAlert } from "lucide-react";

export function MessageBanner({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <div className={`message-banner ${error ? "error" : "success"}`} role="status">
      {error ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
      <span>{error || success}</span>
    </div>
  );
}
