import { NextResponse } from "next/server";
import { run } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) return NextResponse.json({ error: "invalid post" }, { status: 400 });
  const result = run("UPDATE buddy_posts SET view_count = view_count + 1 WHERE id = ?", [postId]);
  return result.changes ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not found" }, { status: 404 });
}
