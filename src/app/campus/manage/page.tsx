/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { Check, Clock3, Plus, X } from "lucide-react";
import { decideHubResponseAction, updateHubStatusAction } from "@/app/actions/hub";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { requireUser } from "@/lib/auth";
import { getHubModule, HUB_STATUS_LABELS } from "@/lib/constants";
import { getHubPostsForUser, getHubResponses } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "我的校园互助" };
export const dynamic = "force-dynamic";

export default async function CampusManagePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/campus/manage"), searchParams]);
  const posts = getHubPostsForUser(user.id);
  return <div className="page-shell"><div className="container"><div className="page-heading split"><div><span className="eyebrow">订单与发布管理</span><h1>我的校园互助</h1><p>处理别人发来的响应，并更新接单、完成或取消状态。</p></div><Link href="/campus/new" className="button primary"><Plus size={17} />发布新信息</Link></div><MessageBanner error={params.error} success={params.success} />{posts.length ? <div className="manage-list">{posts.map((post) => { const module = getHubModule(post.module); const isOwner = post.user_id === user.id; const responses = isOwner ? getHubResponses(post.id) : []; return <article className="manage-card" key={post.id}><div className="manage-summary"><div className="hub-icon">{module.icon}</div><div><span className="eyebrow">{module.label} · {isOwner ? "我发布的" : "我接下的"}</span><Link href={`/campus/${post.id}`}><h2>{post.title}</h2></Link><p><Clock3 size={14} />{formatRelative(post.created_at)} · <span className={`status status-${post.status.toLowerCase()}`}>{HUB_STATUS_LABELS[post.status]}</span></p></div><form action={updateHubStatusAction} className="status-form"><input type="hidden" name="postId" value={post.id} /><select name="status" defaultValue={post.status}><option value="OPEN">重新开放</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option><option value="CANCELLED">已取消</option><option value="CLOSED">已关闭</option></select><button className="button ghost small" type="submit">更新</button></form></div>{isOwner && responses.filter((item) => item.status === "PENDING").length ? <div className="response-review"><h3>待确认响应</h3>{responses.filter((item) => item.status === "PENDING").map((response) => <div className="response-row" key={response.id}><div><strong>{response.nickname}</strong><p>{response.content}</p></div><div className="inline-actions"><form action={decideHubResponseAction}><input type="hidden" name="responseId" value={response.id} /><input type="hidden" name="decision" value="REJECTED" /><button className="button ghost small" type="submit"><X size={14} />拒绝</button></form><form action={decideHubResponseAction}><input type="hidden" name="responseId" value={response.id} /><input type="hidden" name="decision" value="ACCEPTED" /><button className="button primary small" type="submit"><Check size={14} />确认</button></form></div></div>)}</div> : null}</article>; })}</div> : <EmptyState icon="📋" title="还没有互助记录" description="发布或接下一个校园互助任务后，它会出现在这里。" href="/campus/new" action="发布互助" />}</div></div>;
}
