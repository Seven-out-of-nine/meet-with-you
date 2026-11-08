import type { BuddyPost, User } from "./types";

function tokens(value: string) {
  return value
    .toLowerCase()
    .split(/[\s,，、/|#]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

export function scoreBuddyPost(user: Pick<User, "campus" | "major" | "interests">, post: BuddyPost) {
  let score = 0;
  const reasons: string[] = [];
  const searchable = `${post.title} ${post.description} ${post.tags} ${post.category}`.toLowerCase();
  const interests = [...new Set(tokens(user.interests))];
  const matchedInterests = interests.filter((interest) => searchable.includes(interest)).slice(0, 2);

  if (matchedInterests.length) {
    score += matchedInterests.length * 4;
    reasons.push(`共同兴趣：${matchedInterests.join("、")}`);
  }
  if (user.campus && post.location.includes(user.campus)) {
    score += 3;
    reasons.push("同校区更方便");
  }
  if (user.major && post.major && user.major === post.major) {
    score += 2;
    reasons.push("同专业伙伴");
  }
  if (post.activity_time) score += 1;
  if (post.comment_count > 0) score += Math.min(2, post.comment_count);

  return { score, reasons: reasons.slice(0, 2) };
}

export function rankBuddyPosts(user: Pick<User, "campus" | "major" | "interests">, posts: BuddyPost[]) {
  return posts
    .map((post) => {
      const result = scoreBuddyPost(user, post);
      return { ...post, match_score: result.score, match_reasons: result.reasons };
    })
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0) || b.created_at.localeCompare(a.created_at));
}
