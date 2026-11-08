import Link from "next/link";
import { ArrowRight, BellRing, ClipboardCheck, Plus, Sparkles, UsersRound } from "lucide-react";
import { markNotificationsReadAction } from "@/app/actions/buddy";
import { BuddyCard } from "@/components/buddy-card";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { requireUser } from "@/lib/auth";
import { getDashboardStats, getNotifications, getRecommendedBuddyPosts } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "我的工作台" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/dashboard"), searchParams]);
  const stats = getDashboardStats(user.id);
  const notifications = getNotifications(user.id);
  const recommendations = getRecommendedBuddyPosts(user, { status: "OPEN", limit: 3 });
  return <div className="page-shell"><div className="container"><MessageBanner error={params.error} success={params.success} /><section className="dashboard-hero"><div><span className="eyebrow">下午好，{user.nickname}</span><h1>今天也去遇见同频的人吧。</h1><p>{user.bio || "完善个人资料，让合适的搭子更快了解你。"}</p></div><div className="hero-actions"><Link className="button primary" href="/buddies/new"><Plus size={17} />发布搭子</Link><Link className="button secondary" href="/campus/new">发布互助</Link></div></section><div className="stats-grid"><Link href="/buddies/manage" className="stat-card"><Sparkles /><span><strong>{stats.openPosts}</strong><small>我的招募</small></span></Link><Link href="/applications" className="stat-card"><ClipboardCheck /><span><strong>{stats.pendingReceived}</strong><small>待审核申请</small></span></Link><Link href="/matches" className="stat-card"><UsersRound /><span><strong>{stats.activeMatches}</strong><small>进行中搭子</small></span></Link><Link href="/notifications" className="stat-card"><BellRing /><span><strong>{stats.unread}</strong><small>未读通知</small></span></Link></div><div className="dashboard-grid"><section><div className="section-heading compact"><div><span className="eyebrow">为你推荐</span><h2>可能合拍的计划</h2></div><Link className="text-link" href="/buddies?sort=match">更多<ArrowRight size={16} /></Link></div>{recommendations.length ? <div className="card-grid single">{recommendations.map((post) => <BuddyCard key={post.id} post={post} />)}</div> : <EmptyState title="暂时没有新计划" description="不如由你来发布第一个搭子需求。" href="/buddies/new" action="发布计划" />}</section><aside className="notifications-panel"><div className="section-heading compact"><div><span className="eyebrow">站内通知</span><h2>最近动态</h2></div>{stats.unread ? <form action={markNotificationsReadAction}><button className="text-button" type="submit">全部已读</button></form> : null}</div>{notifications.length ? <><div className="notification-list">{notifications.map((item) => <Link className={item.is_read ? "notification" : "notification unread"} href={item.href || "/dashboard"} key={item.id}><span className="notification-dot" /><div><strong>{item.title}</strong><p>{item.content}</p><small>{formatRelative(item.created_at)}</small></div></Link>)}</div><Link className="button ghost full notification-more" href="/notifications">进入通知中心</Link></> : <EmptyState icon="🔔" title="还没有通知" description="申请、审核和组队进度会出现在这里。" />}</aside></div></div></div>;
}
