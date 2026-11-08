import { Send } from "lucide-react";
import { createBuddyPostAction } from "@/app/actions/buddy";
import { MessageBanner } from "@/components/message-banner";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { BUDDY_CATEGORIES } from "@/lib/constants";

export const metadata = { title: "发布搭子需求" };

export default async function NewBuddyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/buddies/new"), searchParams]);
  return (
    <div className="page-shell">
      <div className="container narrow">
        <div className="page-heading">
          <div>
            <span className="eyebrow">发起一个新计划</span>
            <h1>发布搭子需求</h1>
            <p>写清楚你想做什么、什么时候去，以及希望搭子具备怎样的节奏。</p>
          </div>
        </div>
        <MessageBanner error={params.error} />
        <form action={createBuddyPostAction} className="form-card">
          <div className="form-section">
            <h2>计划是什么？</h2>
            <label>
              标题
              <input name="title" required minLength={4} maxLength={80} placeholder="例如：周末一起备战六级，每晚图书馆打卡" />
            </label>
            <div className="field-group">
              <span className="field-label">分类</span>
              <div className="choice-grid">
                {BUDDY_CATEGORIES.map((item) => (
                  <span className="radio-card" key={item.value}>
                    <input id={`category-${item.value}`} type="radio" name="category" value={item.value} required />
                    <label htmlFor={`category-${item.value}`}>
                      <span>{item.icon}</span>
                      <strong>{item.value}</strong>
                      <small>{item.description}</small>
                    </label>
                  </span>
                ))}
              </div>
            </div>
            <label>
              具体描述
              <textarea name="description" required minLength={10} maxLength={1000} rows={6} placeholder="介绍你的目标、计划安排、期望的相处方式等。请勿在这里填写敏感隐私。" />
            </label>
          </div>
          <div className="form-section">
            <h2>时间与地点</h2>
            <div className="form-grid two">
              <label>活动时间<input name="activityTime" maxLength={100} placeholder="如：每周二、四 19:00" /></label>
              <label>地点<input name="location" maxLength={100} placeholder="如：东区图书馆二楼" /></label>
              <label>期望人数<input name="expectedCount" type="number" min={1} max={20} defaultValue={1} /></label>
              <label>标签<input name="tags" maxLength={200} placeholder="六级, 打卡, 晚间" /></label>
            </div>
          </div>
          <div className="form-section">
            <h2>组队联系方式</h2>
            <label>
              联系方式
              <input name="contact" maxLength={100} defaultValue={user.contact} placeholder="微信 / QQ / 手机号" />
              <small className="field-help">仅发布者本人和审核通过的搭子可见。</small>
            </label>
          </div>
          <div className="form-actions">
            <SubmitButton pendingText="正在发布…"><Send size={17} />确认发布</SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
