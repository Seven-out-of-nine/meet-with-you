/* eslint-disable @next/next/no-assign-module-variable */
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { HubCard } from "@/components/hub-card";
import { MessageBanner } from "@/components/message-banner";
import { HUB_MODULES } from "@/lib/constants";
import { listHubPosts } from "@/lib/data";
import type { HubModule } from "@/lib/types";

export const metadata = { title: "校园互助" };
export const dynamic = "force-dynamic";

export default async function CampusPage({ searchParams }: { searchParams: Promise<{ q?: string; module?: HubModule | "ALL"; status?: string; error?: string; success?: string }> }) {
  const params = await searchParams;
  const module = params.module || "ALL";
  const posts = listHubPosts({ q: params.q, module, status: params.status || "ALL" });
  return <div className="page-shell"><div className="container"><div className="page-heading split"><div><span className="eyebrow">校园生活一站互助</span><h1>互助广场</h1><p>代购、二手、跑腿、租借、换课和问答，都能在这里发布、响应和追踪。</p></div><div className="inline-actions"><Link href="/campus/manage" className="button ghost">我的互助</Link><Link href="/campus/new" className="button primary"><Plus size={18} />发布信息</Link></div></div><MessageBanner error={params.error} success={params.success} /><div className="module-grid light">{HUB_MODULES.map((item) => <Link href={`/campus?module=${item.value}`} className={module === item.value ? "module-tile active" : "module-tile"} key={item.value}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small></Link>)}</div><form className="filter-bar" method="get"><label className="search-field"><Search size={18} /><input name="q" defaultValue={params.q} placeholder="搜索物品、课程、地点或问题" /></label><select name="module" defaultValue={module}><option value="ALL">全部类型</option>{HUB_MODULES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select><select name="status" defaultValue={params.status || "ALL"}><option value="ALL">全部状态</option><option value="OPEN">进行中</option><option value="IN_PROGRESS">已接单</option><option value="COMPLETED">已完成</option></select><button className="button secondary" type="submit">搜索</button></form>{posts.length ? <><p className="result-count">共 {posts.length} 条互助信息</p><div className="card-grid three">{posts.map((post) => <HubCard post={post} key={post.id} />)}</div></> : <EmptyState icon="🌤️" title="这里暂时很安静" description="发布一条互助信息，让需要与你能提供的帮助相遇。" href="/campus/new" action="发布互助" />}</div></div>;
}
