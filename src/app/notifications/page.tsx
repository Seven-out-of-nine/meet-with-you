import Link from "next/link";
import { BellRing, CheckCheck, Trash2 } from "lucide-react";
import { clearReadNotificationsAction, markNotificationsReadAction, openNotificationAction } from "@/app/actions/buddy";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { formatRelative } from "@/lib/format";

export const metadata = { title: "通知中心" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string; error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/notifications"), searchParams]);
  const unreadOnly = params.filter === "unread";
  const notifications = getNotifications(user.id, 80, unreadOnly);
  const hasUnread = notifications.some((item) => !item.is_read);
  const hasRead = getNotifications(user.id, 80).some((item) => item.is_read);
  return <div className="page-shell"><div className="container narrow"><div className="page-heading split"><div><span className="eyebrow"><BellRing size={16} />消息不遗漏</span><h1>通知中心</h1><p>集中查看申请、组队、互助进度和搭子消息。</p></div><div className="inline-actions">{hasUnread ? <form action={markNotificationsReadAction}><button className="button secondary small" type="submit"><CheckCheck size={16} />全部已读</button></form> : null}{hasRead ? <form action={clearReadNotificationsAction}><button className="button ghost small" type="submit"><Trash2 size={15} />清理已读</button></form> : null}</div></div><MessageBanner error={params.error} success={params.success} /><div className="filter-chips notification-filters"><Link className={!unreadOnly ? "active" : ""} href="/notifications">全部通知</Link><Link className={unreadOnly ? "active" : ""} href="/notifications?filter=unread">只看未读</Link></div>{notifications.length ? <div className="notification-center-list">{notifications.map((item) => <form action={openNotificationAction} key={item.id}><input type="hidden" name="notificationId" value={item.id} /><button className={item.is_read ? "notification-center-item" : "notification-center-item unread"} type="submit"><span className="notification-icon"><BellRing size={18} /></span><span className="notification-copy"><strong>{item.title}</strong><span>{item.content}</span><small>{formatRelative(item.created_at)}</small></span><span className="notification-open">查看</span></button></form>)}</div> : <EmptyState icon="🔔" title={unreadOnly ? "没有未读通知" : "还没有通知"} description={unreadOnly ? "所有动态都已经看过了。" : "申请、审核和组队进度会出现在这里。"} />}</div></div>;
}
