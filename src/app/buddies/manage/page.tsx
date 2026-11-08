import Link from "next/link";
import { Clock3, Eye, MessageSquareMore, Plus, Users } from "lucide-react";
import { updateBuddyPostStatusAction } from "@/app/actions/buddy";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { requireUser } from "@/lib/auth";
import { BUDDY_STATUS_LABELS, getBuddyCategory } from "@/lib/constants";
import { getManagedBuddyPosts } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "我的发布" };
export const dynamic = "force-dynamic";

export default async function ManageBuddyPostsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/buddies/manage"), searchParams]);
  const posts = getManagedBuddyPosts(user.id);
  return <div className="page-shell"><div className="container"><div className="page-heading split"><div><span className="eyebrow">发布管理</span><h1>我的搭子计划</h1><p>查看招募进度、处理申请，并随时关闭或重新开放计划。</p></div><Link className="button primary" href="/buddies/new"><Plus size={17} />发布新计划</Link></div><MessageBanner error={params.error} success={params.success} />{posts.length ? <div className="manage-list">{posts.map((post) => <article className="manage-card buddy-manage-card" key={post.id}><div className="manage-summary"><span className="manage-module-icon">{getBuddyCategory(post.category).icon}</span><div><div className="card-topline"><span className="category-pill">{post.category}</span><span className={`status status-${post.status.toLowerCase()}`}>{BUDDY_STATUS_LABELS[post.status]}</span></div><Link href={`/buddies/${post.id}`}><h2>{post.title}</h2></Link><p><Clock3 size={14} />{formatRelative(post.created_at)}发布</p></div><div className="manage-metrics"><span><Users size={15} /><strong>{post.accepted_count}/{post.expected_count}</strong>已组队</span><span><MessageSquareMore size={15} /><strong>{post.pending_count}</strong>待审核</span><span><Eye size={15} /><strong>{post.view_count}</strong>浏览</span></div></div><footer className="buddy-manage-actions"><Link className="button ghost small" href={`/buddies/${post.id}`}>查看详情</Link><Link className="button ghost small" href={`/buddies/${post.id}/edit`}>编辑计划</Link>{post.pending_count ? <Link className="button secondary small" href="/applications">处理 {post.pending_count} 个申请</Link> : null}{post.status !== "MATCHED" ? <form action={updateBuddyPostStatusAction}><input type="hidden" name="postId" value={post.id} /><input type="hidden" name="status" value={post.status === "OPEN" ? "CLOSED" : "OPEN"} /><button className="button small primary" type="submit">{post.status === "OPEN" ? "关闭招募" : "重新开放"}</button></form> : null}</footer></article>)}</div> : <EmptyState icon="📝" title="还没有发布计划" description="把时间、地点和期待写清楚，更容易找到合拍的伙伴。" href="/buddies/new" action="发布第一个计划" />}</div></div>;
}
