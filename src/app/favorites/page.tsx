import Link from "next/link";
import { BookmarkCheck, Compass } from "lucide-react";
import { toggleBuddyFavoriteAction } from "@/app/actions/buddy";
import { BuddyCard } from "@/components/buddy-card";
import { EmptyState } from "@/components/empty-state";
import { MessageBanner } from "@/components/message-banner";
import { requireUser } from "@/lib/auth";
import { getFavoriteBuddyPosts } from "@/lib/data";

export const metadata = { title: "我的收藏" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const [user, params] = await Promise.all([requireUser("/favorites"), searchParams]);
  const favorites = getFavoriteBuddyPosts(user.id);
  return <div className="page-shell"><div className="container"><div className="page-heading split"><div><span className="eyebrow"><BookmarkCheck size={16} />稍后再决定</span><h1>我的收藏夹</h1><p>把感兴趣的计划先收好，准备充分后再发送申请。</p></div><Link href="/buddies" className="button secondary"><Compass size={17} />继续逛广场</Link></div><MessageBanner error={params.error} success={params.success} />{favorites.length ? <div className="favorite-grid">{favorites.map((post) => <div className="favorite-item" key={post.id}><BuddyCard post={post} /><form action={toggleBuddyFavoriteAction}><input type="hidden" name="postId" value={post.id} /><input type="hidden" name="returnTo" value="/favorites" /><button type="submit" className="favorite-remove">取消收藏</button></form></div>)}</div> : <EmptyState icon="🔖" title="收藏夹还是空的" description="看到感兴趣的搭子计划时，点一下收藏就能在这里找到。" href="/buddies" action="发现搭子计划" />}</div></div>;
}
