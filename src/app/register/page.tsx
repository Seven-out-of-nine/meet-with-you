import Link from "next/link";
import { UserPlus } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "注册" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <section className="auth-section"><div className="auth-card"><div className="auth-brand"><span className="brand-mark large">油</span><div><h1>加入与你油约</h1><p>让校园里的每个计划都有回应</p></div></div><MessageBanner error={params.error} /><form action={registerAction} className="form-stack"><label>手机号 / 学号<input name="phone" inputMode="numeric" autoComplete="username" required placeholder="6-20 位数字" /></label><label>昵称<input name="nickname" autoComplete="nickname" required maxLength={20} placeholder="其他同学会看到这个名字" /></label><label>密码<input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="至少 8 位" /></label><label>确认密码<input name="confirm" type="password" autoComplete="new-password" required minLength={8} placeholder="再次输入密码" /></label><SubmitButton pendingText="正在创建账号…"><UserPlus size={17} />创建账号</SubmitButton></form><p className="auth-switch">已有账号？<Link href="/login">直接登录</Link></p></div></section>;
}
