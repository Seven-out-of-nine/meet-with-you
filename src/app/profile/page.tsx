import Link from "next/link";
import { Eye, Save } from "lucide-react";
import { updateProfileAction } from "@/app/actions/auth";
import { Avatar } from "@/components/avatar";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "个人资料" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/profile"), searchParams]);
  return <div className="page-shell"><div className="container narrow"><div className="page-heading"><div><span className="eyebrow">个人中心</span><h1>让搭子更了解你</h1><p>真实、清晰的资料有助于提升匹配成功率；联系方式仅在你主动发布或组队成功后展示。</p></div><div className="profile-preview"><Avatar name={user.nickname} size="lg" /><Link className="text-link" href={`/users/${user.id}`}><Eye size={15} />预览公开主页</Link></div></div><MessageBanner error={params.error} success={params.success} /><form action={updateProfileAction} className="form-card"><div className="form-section"><h2>基本信息</h2><div className="form-grid two"><label>昵称<input name="nickname" required maxLength={20} defaultValue={user.nickname} /></label><label>真实姓名（选填）<input name="name" maxLength={30} defaultValue={user.name} /></label><label>性别<select name="gender" defaultValue={user.gender}><option>保密</option><option>男</option><option>女</option><option>其他</option></select></label><label>年级<input name="grade" maxLength={20} defaultValue={user.grade} placeholder="如：2024 级" /></label><label>专业<input name="major" maxLength={50} defaultValue={user.major} placeholder="如：计算机科学与技术" /></label><label>校区<input name="campus" maxLength={50} defaultValue={user.campus} placeholder="如：东校区" /></label></div></div><div className="form-section"><h2>兴趣与介绍</h2><label>兴趣标签<input name="interests" maxLength={200} defaultValue={user.interests} placeholder="羽毛球、摄影、考研、Python（用逗号分隔）" /></label><label>个人简介<textarea name="bio" rows={4} maxLength={500} defaultValue={user.bio} placeholder="介绍一下你的时间习惯、性格和正在做的事" /></label></div><div className="form-section"><h2>联系方式</h2><label>联系方式<input name="contact" maxLength={100} defaultValue={user.contact} placeholder="微信 / QQ / 手机号" /><small className="field-help">组队或互助确认后，对方才会在相关记录中看到。</small></label></div><div className="form-actions"><SubmitButton pendingText="正在保存…"><Save size={17} />保存资料</SubmitButton></div></form></div></div>;
}
