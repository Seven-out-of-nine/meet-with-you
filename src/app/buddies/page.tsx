import Link from "next/link";
import { FolderCog, Plus, Search, SlidersHorizontal } from "lucide-react";
import { BuddyCard } from "@/components/buddy-card";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { BUDDY_CATEGORIES } from "@/lib/constants";
import { getRecommendedBuddyPosts, listBuddyPosts } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "找搭子" };
export const dynamic = "force-dynamic";

export default async function BuddiesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; status?: string; sort?: string; error?: string; success?: string }> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const category = params.category || "全部";
  const status = params.status || "OPEN";
  const sort = params.sort === "popular" ? "popular" : params.sort === "match" && user ? "match" : "latest";
  const filters = { q: params.q, category, status };
  const posts = sort === "match" && user ? getRecommendedBuddyPosts(user, filters) : listBuddyPosts({ ...filters, sort: sort === "popular" ? "popular" : "latest" });
  return <div className="page-shell"><div className="container"><div className="page-heading split"><div><span className="eyebrow">找到你的同频伙伴</span><h1>找搭子广场</h1><p>明确计划，双向选择。先在站内申请，确认后再交换联系方式。</p></div><div className="inline-actions">{user ? <Link href="/buddies/manage" className="button ghost"><FolderCog size={17} />我的发布</Link> : null}<Link href="/buddies/new" className="button primary"><Plus size={18} />发布搭子需求</Link></div></div><MessageBanner error={params.error} success={params.success} /><form className="filter-bar" method="get"><label className="search-field"><Search size={18} /><input name="q" defaultValue={params.q} placeholder="搜索计划、地点或标签" /></label><label className="select-field"><SlidersHorizontal size={17} /><select name="category" defaultValue={category}><option>全部</option>{BUDDY_CATEGORIES.map((item) => <option key={item.value}>{item.value}</option>)}</select></label><select name="status" defaultValue={status} aria-label="招募状态"><option value="OPEN">仅看招募中</option><option value="MATCHED">已组队</option><option value="ALL">全部状态</option></select><select name="sort" defaultValue={sort} aria-label="排序方式"><option value="latest">最新发布</option><option value="popular">热门优先</option>{user ? <option value="match">最适合我</option> : null}</select><button className="button secondary" type="submit">筛选</button></form><div className="filter-chips"><Link className={category === "全部" ? "active" : ""} href={`/buddies?status=${status}&sort=${sort}`}>全部</Link>{BUDDY_CATEGORIES.map((item) => <Link className={category === item.value ? "active" : ""} key={item.value} href={`/buddies?category=${encodeURIComponent(item.value)}&status=${status}&sort=${sort}`}>{item.icon} {item.value}</Link>)}</div>{sort === "match" ? <p className="recommendation-note">✨ 已根据你的兴趣、专业和校区计算匹配度；完善个人资料可获得更准的推荐。</p> : null}{posts.length ? <><p className="result-count">找到 {posts.length} 个计划</p><div className="card-grid three">{posts.map((post) => <BuddyCard key={post.id} post={post} />)}</div></> : <EmptyState icon="🔎" title="没有找到合适的计划" description="换个关键词试试，或者主动发布你的计划。" href="/buddies/new" action="发布搭子需求" />}</div></div>;
}
