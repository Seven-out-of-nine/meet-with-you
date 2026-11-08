"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, createSession, requireUser, setSessionCookie } from "@/lib/auth";
import { queryOne, run } from "@/lib/db";
import { safePath, textField, withMessage } from "@/lib/forms";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function registerAction(formData: FormData) {
  const phone = textField(formData, "phone");
  const nickname = textField(formData, "nickname");
  const password = textField(formData, "password");
  const confirm = textField(formData, "confirm");

  if (!/^\d{6,20}$/.test(phone)) redirect(withMessage("/register", "error", "请输入 6-20 位数字手机号或学号"));
  if (nickname.length < 2 || nickname.length > 20) redirect(withMessage("/register", "error", "昵称需为 2-20 个字符"));
  if (password.length < 8) redirect(withMessage("/register", "error", "密码至少需要 8 位"));
  if (password !== confirm) redirect(withMessage("/register", "error", "两次输入的密码不一致"));
  if (queryOne("SELECT id FROM users WHERE phone = ?", [phone])) redirect(withMessage("/register", "error", "该账号已经注册"));

  const result = run("INSERT INTO users (phone, password_hash, nickname) VALUES (?, ?, ?)", [
    phone,
    hashPassword(password),
    nickname,
  ]);
  const session = createSession(result.lastInsertRowid);
  await setSessionCookie(session.token, session.expiresAt);
  redirect("/profile?success=欢迎加入，请先完善个人资料");
}

export async function loginAction(formData: FormData) {
  const phone = textField(formData, "phone");
  const password = textField(formData, "password");
  const next = safePath(textField(formData, "next"), "/dashboard");
  const user = queryOne<{ id: number; password_hash: string; status: string }>(
    "SELECT id, password_hash, status FROM users WHERE phone = ?",
    [phone],
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    redirect(withMessage(`/login?next=${encodeURIComponent(next)}`, "error", "账号或密码不正确"));
  }
  if (user.status !== "ACTIVE") redirect(withMessage("/login", "error", "该账号已被停用，请联系管理员"));
  const session = createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser("/profile");
  const nickname = textField(formData, "nickname");
  const name = textField(formData, "name");
  const gender = textField(formData, "gender") || "保密";
  const grade = textField(formData, "grade");
  const major = textField(formData, "major");
  const campus = textField(formData, "campus");
  const interests = textField(formData, "interests");
  const bio = textField(formData, "bio");
  const contact = textField(formData, "contact");
  if (nickname.length < 2 || nickname.length > 20) redirect(withMessage("/profile", "error", "昵称需为 2-20 个字符"));
  run(
    `UPDATE users SET nickname = ?, name = ?, gender = ?, grade = ?, major = ?, campus = ?,
                      interests = ?, bio = ?, contact = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [nickname, name, gender, grade, major, campus, interests, bio, contact, user.id],
  );
  revalidatePath("/", "layout");
  redirect(withMessage("/profile", "success", "个人资料已更新"));
}
