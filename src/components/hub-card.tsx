import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { getHubModule, HUB_STATUS_LABELS } from "@/lib/constants";
import { excerpt, formatRelative } from "@/lib/format";
import type { HubPost } from "@/lib/types";
import { Avatar } from "./avatar";

export function HubCard({ post }: { post: HubPost }) {
  const moduleInfo = getHubModule(post.module);
  return (
    <article className="card hub-card">
      <div className="hub-icon">{moduleInfo.icon}</div>
      <div className="hub-card-body">
        <div className="card-topline"><span className="eyebrow">{moduleInfo.label}</span><span className={`status status-${post.status.toLowerCase()}`}>{HUB_STATUS_LABELS[post.status]}</span></div>
        <Link href={`/campus/${post.id}`} className="card-title-link"><h3>{post.title}</h3></Link>
        <p className="card-description">{excerpt(post.description, 100)}</p>
        <div className="meta-row">
          {post.price !== null ? <strong className="price">¥ {post.price.toFixed(2)}</strong> : null}
          {post.location ? <span><MapPin size={15} />{post.location}</span> : null}
          <span><MessageCircle size={15} />{post.response_count}</span>
        </div>
        <footer className="card-footer compact"><div className="author-line"><Avatar name={post.nickname} size="sm" /><span>{post.nickname}</span></div><small>{formatRelative(post.created_at)}</small></footer>
      </div>
    </article>
  );
}
