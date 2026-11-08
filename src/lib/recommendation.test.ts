import { describe, expect, it } from "vitest";
import { rankBuddyPosts, scoreBuddyPost } from "./recommendation";
import type { BuddyPost } from "./types";

const basePost: BuddyPost = {
  id: 1, user_id: 2, title: "周末羽毛球", category: "运动", description: "新手友好", expected_count: 2,
  location: "东校区体育馆", activity_time: "周六 15:00", contact: "", tags: "羽毛球,运动", status: "OPEN",
  view_count: 0, created_at: "2026-01-01", updated_at: "2026-01-01", nickname: "同学", grade: "", major: "计算机科学与技术",
  interests: "", author_bio: "", accepted_count: 0, comment_count: 1, favorite_count: 0,
};

describe("buddy recommendation", () => {
  it("rewards shared interests, campus and major", () => {
    const result = scoreBuddyPost({ interests: "羽毛球,摄影", campus: "东校区", major: "计算机科学与技术" }, basePost);
    expect(result.score).toBeGreaterThanOrEqual(10);
    expect(result.reasons).toContain("共同兴趣：羽毛球");
  });

  it("ranks the more relevant post first", () => {
    const unrelated = { ...basePost, id: 2, title: "桌游局", tags: "桌游", category: "游戏", location: "本部", major: "新闻传播" };
    const ranked = rankBuddyPosts({ interests: "羽毛球", campus: "东校区", major: "计算机科学与技术" }, [unrelated, basePost]);
    expect(ranked[0].id).toBe(1);
  });
});
