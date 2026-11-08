/* eslint-disable @next/next/no-assign-module-variable */
import { Send } from "lucide-react";
import { createHubPostAction } from "@/app/actions/hub";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getHubModule, HUB_MODULES } from "@/lib/constants";
import type { HubModule } from "@/lib/types";

export const metadata = { title: "发布校园互助" };

export default async function NewCampusPostPage({ searchParams }: { searchParams: Promise<{ module?: HubModule; error?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/campus/new"), searchParams]);
  const module = HUB_MODULES.some((item) => item.value === params.module) ? params.module! : "PURCHASE";
  const selected = getHubModule(module);
  return <div className="page-shell"><div className="container narrow"><div className="page-heading"><div><span className="eyebrow">{selected.icon} {selected.label}</span><h1>发布校园互助</h1><p>选择场景并说明需求，系统会保留响应与进度记录。</p></div></div><MessageBanner error={params.error} /><div className="type-switcher">{HUB_MODULES.map((item) => <a href={`/campus/new?module=${item.value}`} className={item.value === module ? "active" : ""} key={item.value}><span>{item.icon}</span>{item.label}</a>)}</div><form action={createHubPostAction} className="form-card"><input type="hidden" name="module" value={module} /><div className="form-section"><h2>{selected.label}信息</h2><label>标题<input name="title" required minLength={4} maxLength={80} placeholder={module === "QUESTION" ? "例如：新生如何预约图书馆研讨室？" : `一句话说清你的${selected.label}需求`} /></label><label>详细描述<textarea name="description" required minLength={10} maxLength={1500} rows={6} placeholder="请写清物品/任务、时间要求、成色或规则等必要信息。" /></label><div className="form-grid two">{module !== "QUESTION" && module !== "COURSE_SWAP" ? <label>{module === "SECOND_HAND" ? "价格" : "预算 / 报酬"}<input name="price" type="number" min="0" step="0.01" placeholder="选填" /></label> : null}<label>地点 / 校区<input name="location" maxLength={100} placeholder="例如：东校区菜鸟驿站" /></label>{module === "RENTAL" || module === "SECOND_HAND" ? <label>物品类别<input name="itemType" maxLength={60} placeholder="电子设备 / 学习用品等" /></label> : null}{module === "PURCHASE" || module === "ERRAND" || module === "RENTAL" ? <label>期望时间<input name="expectedTime" maxLength={100} placeholder="如：明天 18:00 前" /></label> : null}{module === "COURSE_SWAP" ? <><label>换出课程<input name="courseOut" required maxLength={100} placeholder="课程名、教师、时间" /></label><label>期望换入<input name="courseIn" required maxLength={100} placeholder="课程名、教师、时间" /></label></> : null}</div></div><div className="form-section"><h2>沟通方式</h2><label>联系方式<input name="contact" maxLength={100} defaultValue={user.contact} placeholder="微信 / QQ / 手机号" /><small className="field-help">普通互助确认合作后展示；校园问答不会公开联系方式。</small></label></div><div className="form-actions"><SubmitButton pendingText="正在发布…"><Send size={17} />发布{selected.label}</SubmitButton></div></form></div></div>;
}
