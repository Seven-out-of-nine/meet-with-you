import Link from "next/link";
import { Save } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { updateBuddyPostAction } from "@/app/actions/buddy";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { BUDDY_CATEGORIES } from "@/lib/constants";
import { getBuddyPost } from "@/lib/data";

export const metadata = { title: "编辑搭子计划" };
export const dynamic = "force-dynamic";

export default async function EditBuddyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const postId = Number(id);
  const user = await requireUser(`/buddies/${postId}/edit`);
  const post = getBuddyPost(postId);
  if (!post) notFound();
  if (post.user_id !== user.id) redirect("/buddies/manage?error=无权编辑这条计划");

  return <div className="page-shell"><div className="container narrow"><div className="page-heading split"><div><span className="eyebrow">调整你的计划</span><h1>编辑搭子需求</h1><p>时间或安排有变化时及时更新，已经申请的同学也能看到最新信息。</p></div><Link className="button ghost" href={`/buddies/${post.id}`}>取消编辑</Link></div><MessageBanner error={query.error} /><form action={updateBuddyPostAction} className="form-card"><input type="hidden" name="postId" value={post.id} /><div className="form-section"><h2>计划内容</h2><label>标题<input name="title" required minLength={4} maxLength={80} defaultValue={post.title} /></label><div className="field-group"><span className="field-label">分类</span><div className="choice-grid">{BUDDY_CATEGORIES.map((item) => <span className="radio-card" key={item.value}><input id={`edit-category-${item.value}`} type="radio" name="category" value={item.value} required defaultChecked={post.category === item.value} /><label htmlFor={`edit-category-${item.value}`}><span>{item.icon}</span><strong>{item.value}</strong><small>{item.description}</small></label></span>)}</div></div><label>具体描述<textarea name="description" required minLength={10} maxLength={1000} rows={6} defaultValue={post.description} /></label></div><div className="form-section"><h2>时间与地点</h2><div className="form-grid two"><label>活动时间<input name="activityTime" maxLength={100} defaultValue={post.activity_time} /></label><label>地点<input name="location" maxLength={100} defaultValue={post.location} /></label><label>期望人数<input name="expectedCount" type="number" min={Math.max(1, post.accepted_count)} max={20} defaultValue={post.expected_count} /><small className="field-help">当前已有 {post.accepted_count} 人组队</small></label><label>标签<input name="tags" maxLength={200} defaultValue={post.tags} /></label></div></div><div className="form-section"><h2>联系方式</h2><label>联系方式<input name="contact" maxLength={100} defaultValue={post.contact} /><small className="field-help">仍然只对已通过的搭子开放。</small></label></div><div className="form-actions"><SubmitButton pendingText="正在保存…"><Save size={17} />保存修改</SubmitButton></div></form></div></div>;
}
