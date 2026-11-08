"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { HUB_MODULES } from "@/lib/constants";
import { queryOne, run, transaction } from "@/lib/db";
import { intField, numberField, textField, withMessage } from "@/lib/forms";
import type { HubModule, HubStatus } from "@/lib/types";

function notify(userId: number, type: string, title: string, content: string, href: string) {
  run("INSERT INTO notifications (user_id, type, title, content, href) VALUES (?, ?, ?, ?, ?)", [userId, type, title, content, href]);
}

export async function createHubPostAction(formData: FormData) {
  const user = await requireUser("/campus/new");
  const moduleType = textField(formData, "module") as HubModule;
  const title = textField(formData, "title");
  const description = textField(formData, "description");
  const price = numberField(formData, "price");
  const location = textField(formData, "location");
  const contact = textField(formData, "contact") || user.contact;
  if (!HUB_MODULES.some((item) => item.value === moduleType)) redirect(withMessage("/campus/new", "error", "请选择有效的互助类型"));
  if (title.length < 4 || title.length > 80) redirect(withMessage(`/campus/new?module=${moduleType}`, "error", "标题需为 4-80 个字符"));
  if (description.length < 10 || description.length > 1500) redirect(withMessage(`/campus/new?module=${moduleType}`, "error", "描述需为 10-1500 个字符"));
  const metadata = JSON.stringify({
    itemType: textField(formData, "itemType"),
    expectedTime: textField(formData, "expectedTime"),
    courseOut: textField(formData, "courseOut"),
    courseIn: textField(formData, "courseIn"),
  });
  const result = run(
    `INSERT INTO hub_posts (user_id, module, title, description, price, location, contact, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, moduleType, title, description, price, location, contact, metadata],
  );
  revalidatePath("/campus");
  redirect(withMessage(`/campus/${result.lastInsertRowid}`, "success", "互助信息已发布"));
}

export async function respondToHubPostAction(formData: FormData) {
  const postId = intField(formData, "postId");
  const user = await requireUser(`/campus/${postId}`);
  const content = textField(formData, "content");
  const post = queryOne<{ user_id: number; title: string; module: HubModule; status: string }>(
    "SELECT user_id, title, module, status FROM hub_posts WHERE id = ? AND moderation_status = 'APPROVED'",
    [postId],
  );
  if (!post) redirect("/campus?error=信息不存在");
  if (post.user_id === user.id) redirect(withMessage(`/campus/${postId}`, "error", "不能响应自己发布的信息"));
  if (post.status !== "OPEN" && post.module !== "QUESTION") redirect(withMessage(`/campus/${postId}`, "error", "该互助信息已停止响应"));
  if (content.length < 2 || content.length > 800) redirect(withMessage(`/campus/${postId}`, "error", "回复内容需为 2-800 个字符"));
  const status = post.module === "QUESTION" ? "ACCEPTED" : "PENDING";
  try {
    run("INSERT INTO hub_responses (post_id, user_id, content, status) VALUES (?, ?, ?, ?)", [postId, user.id, content, status]);
  } catch {
    redirect(withMessage(`/campus/${postId}`, "error", "你已经响应过这条信息"));
  }
  notify(post.user_id, "HUB_RESPONSE", post.module === "QUESTION" ? "校园问题有新回答" : "收到新的互助响应", `${user.nickname} 回复了「${post.title}」`, `/campus/${postId}`);
  revalidatePath(`/campus/${postId}`);
  redirect(withMessage(`/campus/${postId}`, "success", post.module === "QUESTION" ? "回答发布成功" : "响应已发送，等待发布者确认"));
}

export async function decideHubResponseAction(formData: FormData) {
  const user = await requireUser("/campus/manage");
  const responseId = intField(formData, "responseId");
  const decision = textField(formData, "decision");
  const response = queryOne<{ post_id: number; responder_id: number; owner_id: number; title: string; status: string }>(
    `SELECT r.post_id, r.user_id AS responder_id, p.user_id AS owner_id, p.title, r.status
     FROM hub_responses r JOIN hub_posts p ON p.id = r.post_id WHERE r.id = ?`,
    [responseId],
  );
  if (!response || response.owner_id !== user.id) redirect(withMessage("/campus/manage", "error", "无权处理该响应"));
  if (response.status !== "PENDING") redirect(withMessage("/campus/manage", "error", "该响应已经处理"));
  if (decision !== "ACCEPTED" && decision !== "REJECTED") redirect(withMessage("/campus/manage", "error", "无效操作"));
  transaction(() => {
    run("UPDATE hub_responses SET status = ?, handled_at = CURRENT_TIMESTAMP WHERE id = ?", [decision, responseId]);
    if (decision === "ACCEPTED") {
      run("UPDATE hub_posts SET assignee_id = ?, status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [response.responder_id, response.post_id]);
      run("UPDATE hub_responses SET status = 'REJECTED', handled_at = CURRENT_TIMESTAMP WHERE post_id = ? AND id != ? AND status = 'PENDING'", [response.post_id, responseId]);
      notify(response.responder_id, "HUB_ACCEPTED", "互助响应已通过", `你已接下「${response.title}」，联系方式现已开放`, `/campus/${response.post_id}`);
    } else {
      notify(response.responder_id, "HUB_REJECTED", "互助响应结果", `你对「${response.title}」的响应未通过`, `/campus/${response.post_id}`);
    }
  });
  revalidatePath("/campus", "layout");
  redirect(withMessage("/campus/manage", "success", decision === "ACCEPTED" ? "已确认合作" : "已拒绝该响应"));
}

export async function updateHubStatusAction(formData: FormData) {
  const user = await requireUser("/campus/manage");
  const postId = intField(formData, "postId");
  const nextStatus = textField(formData, "status") as HubStatus;
  const allowed: HubStatus[] = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CLOSED"];
  if (!allowed.includes(nextStatus)) redirect(withMessage("/campus/manage", "error", "无效状态"));
  const post = queryOne<{ user_id: number; assignee_id: number | null }>("SELECT user_id, assignee_id FROM hub_posts WHERE id = ?", [postId]);
  if (!post || (post.user_id !== user.id && post.assignee_id !== user.id)) redirect(withMessage("/campus/manage", "error", "无权更新该订单"));
  run("UPDATE hub_posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [nextStatus, postId]);
  const recipient = post.user_id === user.id ? post.assignee_id : post.user_id;
  if (recipient) notify(recipient, "HUB_STATUS", "互助进度已更新", `订单状态已更新为 ${nextStatus}`, `/campus/${postId}`);
  revalidatePath("/campus", "layout");
  redirect(withMessage("/campus/manage", "success", "状态已更新"));
}

export async function reportContentAction(formData: FormData) {
  const user = await requireUser("/campus");
  const targetType = textField(formData, "targetType");
  const targetId = intField(formData, "targetId");
  const reason = textField(formData, "reason");
  const returnPath = targetType === "BUDDY" ? `/buddies/${targetId}` : `/campus/${targetId}`;
  if ((targetType !== "BUDDY" && targetType !== "HUB") || reason.length < 4) redirect(withMessage(returnPath, "error", "请填写具体举报原因"));
  run("INSERT INTO content_reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)", [user.id, targetType, targetId, reason]);
  redirect(withMessage(returnPath, "success", "举报已提交，管理员会尽快处理"));
}

export async function toggleUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = intField(formData, "userId");
  if (userId === admin.id) redirect(withMessage("/admin", "error", "不能停用当前管理员账号"));
  run("UPDATE users SET status = CASE WHEN status = 'ACTIVE' THEN 'DISABLED' ELSE 'ACTIVE' END, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId]);
  run("DELETE FROM sessions WHERE user_id = ? AND (SELECT status FROM users WHERE id = ?) = 'DISABLED'", [userId, userId]);
  revalidatePath("/admin");
}

export async function moderateHubPostAction(formData: FormData) {
  await requireAdmin();
  const postId = intField(formData, "postId");
  const result = textField(formData, "result");
  if (result !== "APPROVED" && result !== "REJECTED") redirect(withMessage("/admin", "error", "无效审核结果"));
  run("UPDATE hub_posts SET moderation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [result, postId]);
  revalidatePath("/admin");
  revalidatePath("/campus");
}

export async function resolveReportAction(formData: FormData) {
  await requireAdmin();
  const reportId = intField(formData, "reportId");
  const status = textField(formData, "status");
  if (status !== "RESOLVED" && status !== "DISMISSED") redirect(withMessage("/admin", "error", "无效处理结果"));
  run("UPDATE content_reports SET status = ?, handled_at = CURRENT_TIMESTAMP WHERE id = ?", [status, reportId]);
  revalidatePath("/admin");
}
