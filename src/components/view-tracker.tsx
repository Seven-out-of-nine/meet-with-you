"use client";

import { useEffect } from "react";

export function ViewTracker({ postId }: { postId: number }) {
  useEffect(() => {
    const key = `mwy-viewed-buddy-${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch(`/api/buddies/${postId}/view`, { method: "POST", keepalive: true });
  }, [postId]);
  return null;
}
