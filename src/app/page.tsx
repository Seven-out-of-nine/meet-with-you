import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Sparkles, UserRoundPlus, UsersRound } from "lucide-react";
import { BuddyCard } from "@/components/buddy-card";
import { HubCard } from "@/components/hub-card";
import { BUDDY_CATEGORIES, HUB_MODULES } from "@/lib/constants";
import { listBuddyPosts, listHubPosts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const buddies = listBuddyPosts({ status: "OPEN", limit: 3 });
  const hubPosts = listHubPosts({ status: "OPEN", limit: 3 });
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={16} />校园生活，不必一个人</span>
            <h1>找到同频的伙伴，<br /><em>一起把计划变成故事。</em></h1>
            <p>从自习、备考到运动和旅行，发布你的计划，认识靠谱搭子；也可以在一个地方完成校园代购、跑腿、租借与闲置流转。</p>
            <div className="hero-actions"><Link className="button primary large" href="/buddies">开始找搭子<ArrowRight size={19} /></Link><Link className="button secondary large" href="/buddies/new">发布我的计划</Link></div>
            <div className="trust-row"><span><CheckCircle2 size={16} />申请审核</span><span><ShieldCheck size={16} />内容治理</span><span><UsersRound size={16} />双向组队</span></div>
          </div>
          <div className="hero-visual" aria-label="校园搭子场景展示">
            <div className="orbit-card orbit-main"><span className="visual-icon">🤝</span><strong>今天想找什么搭子？</strong><p>发布需求 · 精准筛选 · 双向确认</p></div>
            <div className="orbit-card orbit-one"><span>📚</span><strong>自习搭子</strong><small>图书馆 · 今晚</small></div>
            <div className="orbit-card orbit-two"><span>🏸</span><strong>羽毛球搭子</strong><small>还差 1 人</small></div>
            <div className="orbit-card orbit-three"><span>🍜</span><strong>探店搭子</strong><small>周六出发</small></div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container"><div className="section-heading"><div><span className="eyebrow">快速开始</span><h2>今天，想约个什么搭子？</h2></div><Link href="/buddies" className="text-link">查看全部<ArrowRight size={16} /></Link></div>
          <div className="category-grid">{BUDDY_CATEGORIES.map((item) => <Link key={item.value} href={`/buddies?category=${item.value}`} className="category-tile"><span>{item.icon}</span><strong>{item.value}搭子</strong><small>{item.description}</small></Link>)}</div>
        </div>
      </section>

      <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">正在招募</span><h2>看看同学们的新计划</h2></div><Link href="/buddies" className="text-link">搜索更多<Search size={16} /></Link></div><div className="card-grid three">{buddies.map((post) => <BuddyCard post={post} key={post.id} />)}</div></div></section>

      <section className="section section-dark"><div className="container"><div className="section-heading light"><div><span className="eyebrow">一站式校园互助</span><h2>不只是找搭子</h2><p>原规划书里的六类校园互助场景，都已纳入统一发布、响应和进度管理流程。</p></div><Link href="/campus" className="button light">进入互助广场<ArrowRight size={17} /></Link></div><div className="module-grid">{HUB_MODULES.map((item) => <Link href={`/campus?module=${item.value}`} className="module-tile" key={item.value}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.description}</small></Link>)}</div></div></section>

      {hubPosts.length ? <section className="section"><div className="container"><div className="section-heading"><div><span className="eyebrow">校园新鲜事</span><h2>此刻需要被看见</h2></div></div><div className="card-grid three">{hubPosts.map((post) => <HubCard post={post} key={post.id} />)}</div></div></section> : null}

      <section className="section"><div className="container steps-panel"><div><span className="eyebrow">三步组队</span><h2>发起计划，等一个同频的人</h2></div><ol className="steps"><li><span>01</span><div><UserRoundPlus /><strong>发布需求</strong><p>说清类别、时间、地点与期待。</p></div></li><li><span>02</span><div><Search /><strong>接收申请</strong><p>查看对方资料，自主同意或拒绝。</p></div></li><li><span>03</span><div><UsersRound /><strong>组队成功</strong><p>解锁联系方式，在“我的搭子”管理关系。</p></div></li></ol></div></section>
    </>
  );
}
