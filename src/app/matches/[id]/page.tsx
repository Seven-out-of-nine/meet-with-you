import Link from "next/link";
import { ArrowLeft, CheckCheck, MessageCircle, Send } from "lucide-react";
import { notFound } from "next/navigation";
import { markMatchMessagesReadAction, sendBuddyMessageAction } from "@/app/actions/buddy";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getMatchForUser, getMatchMessages } from "@/lib/data";
import { formatDate, formatRelative } from "@/lib/format";

export const metadata = { title: "搭子空间" };
export const dynamic = "force-dynamic";

export default async function MatchRoomPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const matchId = Number(id);
  const user = await requireUser(`/matches/${matchId}`);
  const match = getMatchForUser(matchId, user.id);
  if (!match) notFound();
  const messages = getMatchMessages(matchId);
  return <div className="page-shell match-room-page"><div className="container narrow"><Link className="back-link" href="/matches"><ArrowLeft size={16} />返回我的搭子</Link><section className="match-room-header"><Avatar name={match.other_nickname} size="lg" /><div><span className="eyebrow">{match.category}搭子空间</span><h1>和 {match.other_nickname} 一起行动</h1><Link href={`/buddies/${match.post_id}`}>{match.post_title}</Link></div><div className="room-contact"><small>已交换联系方式</small><strong>{match.other_contact || "对方暂未填写"}</strong></div></section><MessageBanner error={query.error} success={query.success} />{match.unread_count ? <form action={markMatchMessagesReadAction} className="read-message-form"><input type="hidden" name="matchId" value={match.id} /><button className="text-button" type="submit"><CheckCheck size={16} />将 {match.unread_count} 条消息标为已读</button></form> : null}<section className="chat-panel"><div className="chat-history">{messages.length ? messages.map((message) => { const mine = message.sender_id === user.id; return <div className={mine ? "chat-message mine" : "chat-message"} key={message.id}>{!mine ? <Avatar name={message.sender_nickname} size="sm" /> : null}<div><strong>{mine ? "我" : message.sender_nickname}</strong><p>{message.content}</p><small title={formatDate(message.created_at)}>{formatRelative(message.created_at)}</small></div></div>; }) : <EmptyState icon="👋" title="开始聊聊吧" description="可以先确认集合时间、地点和需要携带的物品。" />}</div><form action={sendBuddyMessageAction} className="chat-composer"><input type="hidden" name="matchId" value={match.id} /><label><span className="sr-only">发送消息</span><textarea name="content" rows={3} minLength={1} maxLength={500} required placeholder="给搭子发消息，确认一下活动安排…" /></label><SubmitButton pendingText="发送中…"><Send size={17} />发送消息</SubmitButton></form></section><div className="safety-tip room-safety"><strong><MessageCircle size={15} />见面提示</strong><p>首次见面优先选择校内公共场所；行程变化及时告知，不轻信转账或代付请求。</p></div></div></div>;
}
