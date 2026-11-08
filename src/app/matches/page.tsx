import Link from "next/link";
import { CheckCircle2, MessageCircle, MessageSquareText, Star } from "lucide-react";
import { completeMatchAction } from "@/app/actions/buddy";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getBuddyCategory } from "@/lib/constants";
import { getMatchesForUser } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "我的搭子" };
export const dynamic = "force-dynamic";

export default async function MatchesPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/matches"), searchParams]);
  const matches = getMatchesForUser(user.id);
  return <div className="page-shell"><div className="container"><div className="page-heading"><div><span className="eyebrow">同行记录</span><h1>我的搭子</h1><p>已确认的搭子关系会保存在这里；活动完成后可以留下评价。</p></div></div><MessageBanner error={params.error} success={params.success} />{matches.length ? <div className="match-grid">{matches.map((match) => <article className={`match-card ${match.status.toLowerCase()}`} key={match.id}><div className="match-banner"><span>{getBuddyCategory(match.category).icon}</span><small>{match.category}搭子</small></div><div className="match-content"><Avatar name={match.other_nickname} size="lg" /><span className={`application-state ${match.status.toLowerCase()}`}>{match.status === "ACTIVE" ? "组队中" : "已完成"}</span><h2>{match.other_nickname}</h2><p>{match.other_major || "校园同学"}</p><Link href={`/buddies/${match.post_id}`} className="match-plan">{match.post_title}</Link><Link href={`/matches/${match.id}`} className="button primary full match-room-button"><MessageSquareText size={16} />进入搭子空间{match.unread_count ? <b>{match.unread_count}</b> : null}</Link><div className="contact-reveal compact"><MessageCircle /><div><small>联系方式</small><strong>{match.other_contact || "对方暂未填写"}</strong></div></div><small>组队于 {formatDate(match.created_at)}</small>{match.status === "ACTIVE" ? <details className="complete-form"><summary><CheckCircle2 size={16} />标记活动已完成</summary><form action={completeMatchAction} className="form-stack compact"><input type="hidden" name="matchId" value={match.id} /><label>体验评分<select name="rating" defaultValue="5"><option value="5">5 分 · 非常合拍</option><option value="4">4 分 · 很不错</option><option value="3">3 分 · 还可以</option><option value="2">2 分 · 有待磨合</option><option value="1">1 分 · 不太合适</option></select></label><label>反馈<textarea name="feedback" rows={3} maxLength={500} placeholder="分享这次搭子体验…" /></label><SubmitButton className="button secondary full" pendingText="正在保存…">完成并评价</SubmitButton></form></details> : <div className="rating-display"><Star size={17} fill="currentColor" />{match.rating || 5} 分<span>{match.feedback}</span></div>}</div></article>)}</div> : <EmptyState icon="🤝" title="还没有搭子记录" description="申请一个感兴趣的计划，或发布自己的需求。" href="/buddies" action="去找搭子" />}</div></div>;
}
