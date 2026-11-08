import Link from "next/link";

export function EmptyState({ icon = "🌱", title, description, href, action }: { icon?: string; title: string; description: string; href?: string; action?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && action ? <Link className="button secondary" href={href}>{action}</Link> : null}
    </div>
  );
}
