import { ViewTracker } from "@/components/view-tracker";

export default async function BuddyDetailLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const postId = Number(id);
  return <>{Number.isInteger(postId) && postId > 0 ? <ViewTracker postId={postId} /> : null}{children}</>;
}
