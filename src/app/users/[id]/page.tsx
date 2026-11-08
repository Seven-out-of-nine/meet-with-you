import Link from "next/link";
import { Award, CalendarCheck2, MapPin, MessageCircleMore, Star, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { BuddyCard } from "@/components/buddy-card";
import { EmptyState } from "@/components/empty-state";
import { getPublicUser, getPublicUserOverview } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getPublicUser(Number(id));
  if (!user || user.status !== "ACTIVE") notFound();
  const { stats, posts } = getPublicUserOverview(user.id);
  const level = stats.completed_matches >= 5 && (stats.average_rating ?? 0) >= 4.5 ? "优质搭子" : stats.completed_matches >= 2 ? "活跃伙伴" : "校园新伙伴";
  return <div className="page-shell public-profile-page"><div className="container"><section className="public-profile-hero"><Avatar name={user.nickname} size="lg" /><div className="public-profile-copy"><span className="trust-label"><Award size={15} />{level}</span><h1>{user.nickname}</h1><p>{[user.grade, user.major].filter(Boolean).join(" · ") || "校园同学"}</p>{user.campus ? <small><MapPin size={14} />{user.campus}</small> : null}</div><div className="public-profile-stats"><span><strong>{stats.published_posts}</strong><small>发布计划</small></span><span><strong>{stats.completed_matches}</strong><small>完成同行</small></span><span><strong>{stats.average_rating ?? "—"}</strong><small>{stats.rating_count ? `${stats.rating_count} 次评价` : "暂无评分"}</small></span></div></section><div className="public-profile-grid"><section className="profile-about-card"><span className="eyebrow"><UserRound size={15} />关于 TA</span><h2>认识一下 {user.nickname}</h2><p>{user.bio || "TA 还没有填写个人简介。"}</p><div className="profile-facts"><span><strong>兴趣标签</strong>{user.interests || "暂未填写"}</span><span><strong>加入时间</strong>{formatDate(user.created_at)}</span></div><div className="profile-safety"><Star size={17} /><p>评分来自已完成的真实搭子记录。请结合计划详情和站内沟通自行判断是否合拍。</p></div></section><aside className="profile-contact-note"><MessageCircleMore /><h3>如何联系 TA？</h3><p>为了保护隐私，公开主页不展示联系方式。申请通过后可在“我的搭子”中查看并进入搭子空间。</p><Link className="button primary full" href="/buddies">寻找合适计划</Link></aside></div><section className="profile-posts"><div className="section-heading"><div><span className="eyebrow"><CalendarCheck2 size={15} />最近发布</span><h2>TA 的搭子计划</h2></div></div>{posts.length ? <div className="card-grid three">{posts.map((post) => <BuddyCard post={post} key={post.id} />)}</div> : <EmptyState icon="🌱" title="暂时没有公开计划" description="可以稍后再来看看。" />}</section></div></div>;
}
