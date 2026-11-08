import Link from "next/link";
import { Bookmark, Clock3, MapPin, MessageCircle, Sparkles, Users } from "lucide-react";
import { BUDDY_STATUS_LABELS, getBuddyCategory } from "@/lib/constants";
import { excerpt, formatRelative } from "@/lib/format";
import type { BuddyPost } from "@/lib/types";
import { Avatar } from "./avatar";

export function BuddyCard({ post }: { post: BuddyPost }) {
  const category = getBuddyCategory(post.category);
  return (
    <article className="card buddy-card">
      <div className="card-topline">
        <span className="category-pill"><span>{category.icon}</span>{post.category}</span>
        <span className={`status status-${post.status.toLowerCase()}`}>{BUDDY_STATUS_LABELS[post.status]}</span>
      </div>
      <Link href={`/buddies/${post.id}`} className="card-title-link"><h3>{post.title}</h3></Link>
      <p className="card-description">{excerpt(post.description)}</p>
      {post.match_reasons?.length ? <div className="match-reason"><Sparkles size={15} /><span>{post.match_reasons.join(" · ")}</span>{post.match_score ? <strong>{post.match_score} 分匹配</strong> : null}</div> : null}
      <div className="meta-row">
        {post.location ? <span><MapPin size={15} />{post.location}</span> : null}
        {post.activity_time ? <span><Clock3 size={15} />{post.activity_time}</span> : null}
      </div>
      <div className="tag-row">
        {post.tags.split(/[,，]/).filter(Boolean).slice(0, 4).map((tag) => <span key={tag}>#{tag.trim()}</span>)}
      </div>
      <footer className="card-footer">
        <Link href={`/users/${post.user_id}`} className="author-line" aria-label={`查看 ${post.nickname} 的主页`}><Avatar name={post.nickname} size="sm" /><span><strong>{post.nickname}</strong><small>{post.grade || post.major || formatRelative(post.created_at)}</small></span></Link>
        <div className="card-counts"><span title="收藏"><Bookmark size={15} />{post.favorite_count}</span><span><Users size={15} />{post.accepted_count}/{post.expected_count}</span><span><MessageCircle size={15} />{post.comment_count}</span></div>
      </footer>
    </article>
  );
}
