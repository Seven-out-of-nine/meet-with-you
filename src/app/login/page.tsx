import Link from "next/link";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  return <section className="auth-section"><div className="auth-card"><div className="auth-brand"><span className="brand-mark large">油</span><div><h1>欢迎回来</h1><p>登录后继续寻找同频搭子</p></div></div><MessageBanner error={params.error} /><form action={loginAction} className="form-stack"><input type="hidden" name="next" value={params.next || "/dashboard"} /><label>手机号 / 学号<input name="phone" inputMode="numeric" autoComplete="username" required placeholder="请输入注册账号" /></label><label>密码<input name="password" type="password" autoComplete="current-password" required placeholder="至少 8 位" /></label><SubmitButton pendingText="正在登录…"><LogIn size={17} />登录</SubmitButton></form><p className="auth-switch">还没有账号？<Link href="/register">免费注册</Link></p><div className="demo-hint"><strong>演示账号</strong><span>学生：13800000001 / student123</span><span>管理员：13900000000 / admin123456</span></div></div></section>;
}
