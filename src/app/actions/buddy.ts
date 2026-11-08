"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { BUDDY_CATEGORIES } from "@/lib/constants";
import { queryOne, run, transaction } from "@/lib/db";
import { intField, textField, withMessage } from "@/lib/forms";

function notify(userId: number, type: string, title: string, content: string, href: string) {
  run("INSERT INTO notifications (user_id, type, title, content, href) VALUES (?, ?, ?, ?, ?)", [
    userId,
    type,
    title,
    content,
    href,
  ]);
}

function safeInternalPath(value: string, fallback: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function createBuddyPostAction(formData: FormData) {
  const user = await requireUser("/buddies/new");
  const title = textField(formData, "title");
  const category = textField(formData, "category");
  const description = textField(formData, "description");
  const expectedCount = Math.min(20, Math.max(1, intField(formData, "expectedCount", 1)));
  const location = textField(formData, "location");
  const activityTime = textField(formData, "activityTime");
  const contact = textField(formData, "contact") || user.contact;
  const tags = textField(formData, "tags");
  if (title.length < 4 || title.length > 80) redirect(withMessage("/buddies/new", "error", "标题需为 4-80 个字符"));
  if (description.length < 10 || description.length > 1000) redirect(withMessage("/buddies/new", "error", "请用 10-1000 个字符描述你的计划"));
  if (!BUDDY_CATEGORIES.some((item) => item.value === category)) redirect(withMessage("/buddies/new", "error", "请选择有效的搭子分类"));
  const result = run(
    `INSERT INTO buddy_posts (user_id, title, category, description, expected_count, location, activity_time, contact, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, title, category, description, expectedCount, location, activityTime, contact, tags],
  );
  revalidatePath("/buddies");
  redirect(withMessage(`/buddies/${result.lastInsertRowid}`, "success", "搭子申请发布成功"));
}

export async function updateBuddyPostAction(formData: FormData) {
  const postId = intField(formData, "postId");
  const user = await requireUser(`/buddies/${postId}/edit`);
  const title = textField(formData, "title");
  const category = textField(formData, "category");
  const description = textField(formData, "description");
  const expectedCount = Math.min(20, Math.max(1, intField(formData, "expectedCount", 1)));
  const location = textField(formData, "location");
  const activityTime = textField(formData, "activityTime");
  const contact = textField(formData, "contact") || user.contact;
  const tags = textField(formData, "tags");
  const post = queryOne<{ user_id: number; accepted_count: number }>(
    `SELECT p.user_id, (SELECT COUNT(*) FROM buddy_applications a WHERE a.post_id = p.id AND a.status = 'ACCEPTED') AS accepted_count
     FROM buddy_posts p WHERE p.id = ?`,
    [postId],
  );
  if (!post || post.user_id !== user.id) redirect(withMessage("/buddies/manage", "error", "无权编辑这条计划"));
  if (title.length < 4 || title.length > 80) redirect(withMessage(`/buddies/${postId}/edit`, "error", "标题需为 4-80 个字符"));
  if (description.length < 10 || description.length > 1000) redirect(withMessage(`/buddies/${postId}/edit`, "error", "描述需为 10-1000 个字符"));
  if (!BUDDY_CATEGORIES.some((item) => item.value === category)) redirect(withMessage(`/buddies/${postId}/edit`, "error", "请选择有效分类"));
  if (expectedCount < post.accepted_count) redirect(withMessage(`/buddies/${postId}/edit`, "error", `期望人数不能少于已组队人数 ${post.accepted_count}`));
  run(
    `UPDATE buddy_posts SET title = ?, category = ?, description = ?, expected_count = ?, location = ?,
                            activity_time = ?, contact = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [title, category, description, expectedCount, location, activityTime, contact, tags, postId, user.id],
  );
  revalidatePath("/buddies", "layout");
  redirect(withMessage(`/buddies/${postId}`, "success", "计划已更新"));
}

export async function applyToBuddyAction(formData: FormData) {
  const postId = intField(formData, "postId");
  const user = await requireUser(`/buddies/${postId}`);
  const message = textField(formData, "message");
  const post = queryOne<{ user_id: number; status: string; title: string }>("SELECT user_id, status, title FROM buddy_posts WHERE id = ?", [postId]);
  if (!post) redirect("/buddies?error=申请不存在");
  if (post.user_id === user.id) redirect(withMessage(`/buddies/${postId}`, "error", "不能申请自己发布的搭子"));
  if (post.status !== "OPEN") redirect(withMessage(`/buddies/${postId}`, "error", "该搭子已经停止招募"));
  const existing = queryOne<{ id: number; status: string }>("SELECT id, status FROM buddy_applications WHERE post_id = ? AND applicant_id = ?", [postId, user.id]);
  if (existing?.status === "PENDING" || existing?.status === "ACCEPTED") {
    redirect(withMessage(`/buddies/${postId}`, "error", "你已经申请过这个搭子"));
  }
  if (existing) {
    run("UPDATE buddy_applications SET message = ?, status = 'PENDING', created_at = CURRENT_TIMESTAMP, decided_at = NULL WHERE id = ?", [message, existing.id]);
  } else {
    run("INSERT INTO buddy_applications (post_id, applicant_id, message) VALUES (?, ?, ?)", [postId, user.id, message]);
  }
  notify(post.user_id, "BUDDY_APPLICATION", "收到新的搭子申请", `${user.nickname} 申请加入「${post.title}」`, "/applications");
  revalidatePath(`/buddies/${postId}`);
  redirect(withMessage("/applications", "success", "申请已发送，等待发布者审核"));
}

export async function decideBuddyApplicationAction(formData: FormData) {
  const user = await requireUser("/applications");
  const applicationId = intField(formData, "applicationId");
  const decision = textField(formData, "decision");
  const application = queryOne<{
    id: number;
    post_id: number;
    applicant_id: number;
    status: string;
    title: string;
    category: string;
    expected_count: number;
    owner_id: number;
  }>(
    `SELECT a.id, a.post_id, a.applicant_id, a.status, p.title, p.category, p.expected_count, p.user_id AS owner_id
     FROM buddy_applications a JOIN buddy_posts p ON p.id = a.post_id WHERE a.id = ?`,
    [applicationId],
  );
  if (!application || application.owner_id !== user.id) redirect(withMessage("/applications", "error", "无权处理该申请"));
  if (application.status !== "PENDING") redirect(withMessage("/applications", "error", "该申请已经处理过"));
  if (decision !== "ACCEPTED" && decision !== "REJECTED") redirect(withMessage("/applications", "error", "无效操作"));

  transaction(() => {
    run("UPDATE buddy_applications SET status = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?", [decision, applicationId]);
    if (decision === "ACCEPTED") {
      run(
        `INSERT OR IGNORE INTO buddy_matches (post_id, owner_id, partner_id, category) VALUES (?, ?, ?, ?)`,
        [application.post_id, user.id, application.applicant_id, application.category],
      );
      const count = queryOne<{ count: number }>(
        "SELECT COUNT(*) AS count FROM buddy_applications WHERE post_id = ? AND status = 'ACCEPTED'",
        [application.post_id],
      )?.count ?? 0;
      if (count >= application.expected_count) run("UPDATE buddy_posts SET status = 'MATCHED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [application.post_id]);
      notify(application.applicant_id, "BUDDY_MATCH", "组队成功！", `你已加入「${application.title}」，双方联系方式现已开放`, "/matches");
    } else {
      notify(application.applicant_id, "BUDDY_APPLICATION", "搭子申请结果", `你对「${application.title}」的申请未通过，可以继续看看其他搭子`, "/applications");
    }
  });
  revalidatePath("/applications");
  revalidatePath("/matches");
  redirect(withMessage("/applications", "success", decision === "ACCEPTED" ? "已同意，组队成功" : "已拒绝该申请"));
}

export async function addBuddyCommentAction(formData: FormData) {
  const postId = intField(formData, "postId");
  const user = await requireUser(`/buddies/${postId}`);
  const content = textField(formData, "content");
  if (content.length < 2 || content.length > 300) redirect(withMessage(`/buddies/${postId}`, "error", "留言需为 2-300 个字符"));
  const post = queryOne<{ user_id: number; title: string }>("SELECT user_id, title FROM buddy_posts WHERE id = ?", [postId]);
  if (!post) redirect("/buddies?error=搭子不存在");
  run("INSERT INTO buddy_comments (post_id, user_id, content) VALUES (?, ?, ?)", [postId, user.id, content]);
  if (post.user_id !== user.id) notify(post.user_id, "BUDDY_COMMENT", "搭子动态有新留言", `${user.nickname} 评论了「${post.title}」`, `/buddies/${postId}`);
  revalidatePath(`/buddies/${postId}`);
}

export async function closeBuddyPostAction(formData: FormData) {
  const user = await requireUser("/buddies");
  const postId = intField(formData, "postId");
  run("UPDATE buddy_posts SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", [postId, user.id]);
  revalidatePath("/buddies");
  redirect(withMessage(`/buddies/${postId}`, "success", "招募已关闭"));
}

export async function toggleBuddyFavoriteAction(formData: FormData) {
  const postId = intField(formData, "postId");
  const returnTo = safeInternalPath(textField(formData, "returnTo"), `/buddies/${postId}`);
  const user = await requireUser(returnTo);
  const post = queryOne<{ id: number }>("SELECT id FROM buddy_posts WHERE id = ?", [postId]);
  if (!post) redirect(withMessage("/buddies", "error", "搭子计划不存在"));
  const favorite = queryOne("SELECT 1 FROM buddy_favorites WHERE user_id = ? AND post_id = ?", [user.id, postId]);
  if (favorite) {
    run("DELETE FROM buddy_favorites WHERE user_id = ? AND post_id = ?", [user.id, postId]);
  } else {
    run("INSERT INTO buddy_favorites (user_id, post_id) VALUES (?, ?)", [user.id, postId]);
  }
  revalidatePath(`/buddies/${postId}`);
  revalidatePath("/favorites");
  revalidatePath("/buddies");
  redirect(withMessage(returnTo, "success", favorite ? "已取消收藏" : "已加入收藏夹"));
}

export async function updateBuddyPostStatusAction(formData: FormData) {
  const user = await requireUser("/buddies/manage");
  const postId = intField(formData, "postId");
  const nextStatus = textField(formData, "status");
  if (nextStatus !== "OPEN" && nextStatus !== "CLOSED") redirect(withMessage("/buddies/manage", "error", "无效状态"));
  const post = queryOne<{ user_id: number; expected_count: number; accepted_count: number }>(
    `SELECT p.user_id, p.expected_count,
            (SELECT COUNT(*) FROM buddy_applications a WHERE a.post_id = p.id AND a.status = 'ACCEPTED') AS accepted_count
     FROM buddy_posts p WHERE p.id = ?`,
    [postId],
  );
  if (!post || post.user_id !== user.id) redirect(withMessage("/buddies/manage", "error", "无权管理这条招募"));
  if (nextStatus === "OPEN" && post.accepted_count >= post.expected_count) {
    redirect(withMessage("/buddies/manage", "error", "当前组队人数已满，暂不能重新开放"));
  }
  run("UPDATE buddy_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [nextStatus, postId]);
  revalidatePath("/buddies", "layout");
  redirect(withMessage("/buddies/manage", "success", nextStatus === "OPEN" ? "招募已重新开放" : "招募已关闭"));
}

export async function sendBuddyMessageAction(formData: FormData) {
  const matchId = intField(formData, "matchId");
  const user = await requireUser(`/matches/${matchId}`);
  const content = textField(formData, "content");
  if (content.length < 1 || content.length > 500) redirect(withMessage(`/matches/${matchId}`, "error", "消息需为 1-500 个字符"));
  const match = queryOne<{ owner_id: number; partner_id: number; post_title: string }>(
    `SELECT m.owner_id, m.partner_id, p.title AS post_title
     FROM buddy_matches m JOIN buddy_posts p ON p.id = m.post_id WHERE m.id = ?`,
    [matchId],
  );
  if (!match || (match.owner_id !== user.id && match.partner_id !== user.id)) {
    redirect(withMessage("/matches", "error", "无权进入这个搭子空间"));
  }
  const recipientId = match.owner_id === user.id ? match.partner_id : match.owner_id;
  transaction(() => {
    run("INSERT INTO buddy_messages (match_id, sender_id, content) VALUES (?, ?, ?)", [matchId, user.id, content]);
    notify(recipientId, "BUDDY_MESSAGE", "搭子发来新消息", `${user.nickname} 在「${match.post_title}」中给你留言`, `/matches/${matchId}`);
  });
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
  redirect(withMessage(`/matches/${matchId}`, "success", "消息已发送"));
}

export async function markMatchMessagesReadAction(formData: FormData) {
  const matchId = intField(formData, "matchId");
  const user = await requireUser(`/matches/${matchId}`);
  const match = queryOne<{ owner_id: number; partner_id: number }>("SELECT owner_id, partner_id FROM buddy_matches WHERE id = ?", [matchId]);
  if (!match || (match.owner_id !== user.id && match.partner_id !== user.id)) redirect("/matches");
  run("UPDATE buddy_messages SET is_read = 1 WHERE match_id = ? AND sender_id != ?", [matchId, user.id]);
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/matches");
}

export async function completeMatchAction(formData: FormData) {
  const user = await requireUser("/matches");
  const matchId = intField(formData, "matchId");
  const rating = Math.min(5, Math.max(1, intField(formData, "rating", 5)));
  const feedback = textField(formData, "feedback").slice(0, 500);
  const match = queryOne<{ owner_id: number; partner_id: number }>("SELECT owner_id, partner_id FROM buddy_matches WHERE id = ?", [matchId]);
  if (!match || (match.owner_id !== user.id && match.partner_id !== user.id)) redirect(withMessage("/matches", "error", "无权操作该搭子记录"));
  run(
    "UPDATE buddy_matches SET status = 'COMPLETED', rating = ?, feedback = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
    [rating, feedback, matchId],
  );
  revalidatePath("/matches");
  redirect(withMessage("/matches", "success", "搭子旅程已完成，感谢你的评价"));
}

export async function clearCompletedApplicationsAction() {
  const user = await requireUser("/applications");
  run(
    `UPDATE buddy_applications SET status = 'CLEARED'
     WHERE status IN ('ACCEPTED', 'REJECTED', 'EXPIRED')
       AND (applicant_id = ? OR post_id IN (SELECT id FROM buddy_posts WHERE user_id = ?))`,
    [user.id, user.id],
  );
  revalidatePath("/applications");
  redirect(withMessage("/applications", "success", "已清理处理完成的申请"));
}

export async function withdrawBuddyApplicationAction(formData: FormData) {
  const user = await requireUser("/applications");
  const applicationId = intField(formData, "applicationId");
  const application = queryOne<{ post_id: number; owner_id: number; title: string }>(
    `SELECT a.post_id, p.user_id AS owner_id, p.title
     FROM buddy_applications a JOIN buddy_posts p ON p.id = a.post_id
     WHERE a.id = ? AND a.applicant_id = ? AND a.status = 'PENDING'`,
    [applicationId, user.id],
  );
  if (!application) redirect(withMessage("/applications", "error", "该申请已无法撤回"));
  run("UPDATE buddy_applications SET status = 'CLEARED', decided_at = CURRENT_TIMESTAMP WHERE id = ?", [applicationId]);
  notify(application.owner_id, "BUDDY_APPLICATION", "申请人撤回了申请", `${user.nickname} 撤回了对「${application.title}」的申请`, "/applications");
  revalidatePath("/applications");
  revalidatePath(`/buddies/${application.post_id}`);
  redirect(withMessage("/applications", "success", "申请已撤回，你之后仍可重新申请"));
}

export async function markNotificationsReadAction() {
  const user = await requireUser("/notifications");
  run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user.id]);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}

export async function openNotificationAction(formData: FormData) {
  const user = await requireUser("/notifications");
  const notificationId = intField(formData, "notificationId");
  const notification = queryOne<{ href: string }>("SELECT href FROM notifications WHERE id = ? AND user_id = ?", [notificationId, user.id]);
  if (!notification) redirect(withMessage("/notifications", "error", "通知不存在"));
  run("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [notificationId, user.id]);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect(safeInternalPath(notification.href, "/notifications"));
}

export async function clearReadNotificationsAction() {
  const user = await requireUser("/notifications");
  run("DELETE FROM notifications WHERE user_id = ? AND is_read = 1", [user.id]);
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  redirect(withMessage("/notifications", "success", "已清理读过的通知"));
}
