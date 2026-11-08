import { queryAll, queryOne } from "./db";
import type {
  BuddyApplication,
  BuddyComment,
  BuddyMatch,
  BuddyMessage,
  BuddyPost,
  HubModule,
  HubPost,
  HubResponse,
  Notification,
  ManagedBuddyPost,
  User,
} from "./types";
import { rankBuddyPosts } from "./recommendation";

const BUDDY_SELECT = `
  SELECT p.*, u.nickname, u.grade, u.major, u.interests, u.bio AS author_bio,
         (SELECT COUNT(*) FROM buddy_applications a WHERE a.post_id = p.id AND a.status = 'ACCEPTED') AS accepted_count,
         (SELECT COUNT(*) FROM buddy_comments c WHERE c.post_id = p.id) AS comment_count,
         (SELECT COUNT(*) FROM buddy_favorites f WHERE f.post_id = p.id) AS favorite_count
  FROM buddy_posts p
  JOIN users u ON u.id = p.user_id
`;

export function listBuddyPosts(filters: { q?: string; category?: string; status?: string; limit?: number; sort?: "latest" | "popular" } = {}) {
  const clauses = ["u.status = 'ACTIVE'"];
  const params: Array<string | number> = [];
  if (filters.status && filters.status !== "ALL") {
    clauses.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.category && filters.category !== "全部") {
    clauses.push("p.category = ?");
    params.push(filters.category);
  }
  if (filters.q) {
    clauses.push("(p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ? OR p.location LIKE ?)");
    const q = `%${filters.q}%`;
    params.push(q, q, q, q);
  }
  params.push(filters.limit ?? 60);
  const orderBy = filters.sort === "popular"
    ? "favorite_count DESC, comment_count DESC, p.created_at DESC"
    : "p.created_at DESC";
  return queryAll<BuddyPost>(`${BUDDY_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY ${orderBy} LIMIT ?`, params);
}

export function getBuddyPost(id: number) {
  return queryOne<BuddyPost>(`${BUDDY_SELECT} WHERE p.id = ?`, [id]);
}

export function getBuddyComments(postId: number) {
  return queryAll<BuddyComment>(
    `SELECT c.*, u.nickname FROM buddy_comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ? ORDER BY c.created_at ASC`,
    [postId],
  );
}

export function getApplicationForUser(postId: number, userId: number) {
  return queryOne<{ id: number; status: string }>(
    "SELECT id, status FROM buddy_applications WHERE post_id = ? AND applicant_id = ?",
    [postId, userId],
  );
}

export function isBuddyPostFavorited(postId: number, userId: number) {
  return Boolean(queryOne("SELECT 1 FROM buddy_favorites WHERE post_id = ? AND user_id = ?", [postId, userId]));
}

export function getFavoriteBuddyPosts(userId: number) {
  return queryAll<BuddyPost>(
    `${BUDDY_SELECT}
     WHERE EXISTS (SELECT 1 FROM buddy_favorites favorite WHERE favorite.post_id = p.id AND favorite.user_id = ?)
     ORDER BY (SELECT created_at FROM buddy_favorites favorite WHERE favorite.post_id = p.id AND favorite.user_id = ?) DESC`,
    [userId, userId],
  );
}

export function getManagedBuddyPosts(userId: number) {
  return queryAll<ManagedBuddyPost>(
    `SELECT base.*,
            (SELECT COUNT(*) FROM buddy_applications a WHERE a.post_id = base.id AND a.status = 'PENDING') AS pending_count
     FROM (${BUDDY_SELECT}) base
     WHERE base.user_id = ?
     ORDER BY base.created_at DESC`,
    [userId],
  );
}

export function getRecommendedBuddyPosts(
  user: Pick<User, "id" | "campus" | "major" | "interests">,
  filters: { q?: string; category?: string; status?: string; limit?: number } = {},
) {
  const limit = filters.limit ?? 60;
  const candidates = listBuddyPosts({ ...filters, limit: Math.max(limit * 3, 60) }).filter((post) => post.user_id !== user.id);
  return rankBuddyPosts(user, candidates).slice(0, limit);
}

const APPLICATION_SELECT = `
  SELECT a.*, p.title AS post_title, p.category AS post_category, p.user_id AS owner_id,
         owner.nickname AS owner_nickname, applicant.nickname AS applicant_nickname,
         applicant.grade AS applicant_grade, applicant.major AS applicant_major,
         applicant.interests AS applicant_interests
  FROM buddy_applications a
  JOIN buddy_posts p ON p.id = a.post_id
  JOIN users owner ON owner.id = p.user_id
  JOIN users applicant ON applicant.id = a.applicant_id
`;

export function getApplicationsForUser(userId: number) {
  const sent = queryAll<BuddyApplication>(
    `${APPLICATION_SELECT} WHERE a.applicant_id = ? AND a.status != 'CLEARED' ORDER BY a.created_at DESC`,
    [userId],
  );
  const received = queryAll<BuddyApplication>(
    `${APPLICATION_SELECT} WHERE p.user_id = ? AND a.status != 'CLEARED' ORDER BY a.created_at DESC`,
    [userId],
  );
  return { sent, received };
}

export function getMatchesForUser(userId: number) {
  return queryAll<BuddyMatch>(
    `SELECT m.*, p.title AS post_title,
            CASE WHEN m.owner_id = ? THEN m.partner_id ELSE m.owner_id END AS other_user_id,
            other.nickname AS other_nickname, other.contact AS other_contact, other.major AS other_major,
            (SELECT COUNT(*) FROM buddy_messages message
             WHERE message.match_id = m.id AND message.sender_id != ? AND message.is_read = 0) AS unread_count
     FROM buddy_matches m
     JOIN buddy_posts p ON p.id = m.post_id
     JOIN users other ON other.id = CASE WHEN m.owner_id = ? THEN m.partner_id ELSE m.owner_id END
     WHERE m.owner_id = ? OR m.partner_id = ?
     ORDER BY m.status = 'ACTIVE' DESC, m.created_at DESC`,
    [userId, userId, userId, userId, userId],
  );
}

export function getMatchForUser(matchId: number, userId: number) {
  return getMatchesForUser(userId).find((match) => match.id === matchId);
}

export function getMatchMessages(matchId: number) {
  return queryAll<BuddyMessage>(
    `SELECT message.*, sender.nickname AS sender_nickname
     FROM buddy_messages message
     JOIN users sender ON sender.id = message.sender_id
     WHERE message.match_id = ?
     ORDER BY message.created_at ASC, message.id ASC
     LIMIT 200`,
    [matchId],
  );
}

export function getDashboardStats(userId: number) {
  return {
    openPosts: queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM buddy_posts WHERE user_id = ? AND status = 'OPEN'", [userId])?.count ?? 0,
    pendingReceived: queryOne<{ count: number }>(
      `SELECT COUNT(*) AS count FROM buddy_applications a JOIN buddy_posts p ON p.id = a.post_id
       WHERE p.user_id = ? AND a.status = 'PENDING'`,
      [userId],
    )?.count ?? 0,
    activeMatches: queryOne<{ count: number }>(
      "SELECT COUNT(*) AS count FROM buddy_matches WHERE (owner_id = ? OR partner_id = ?) AND status = 'ACTIVE'",
      [userId, userId],
    )?.count ?? 0,
    unread: queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0", [userId])?.count ?? 0,
  };
}

export function getNotifications(userId: number, limit = 12, unreadOnly = false) {
  return queryAll<Notification>(
    `SELECT * FROM notifications WHERE user_id = ? ${unreadOnly ? "AND is_read = 0" : ""} ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
  );
}

export function getUnreadNotificationCount(userId: number) {
  return queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0", [userId])?.count ?? 0;
}

const HUB_SELECT = `
  SELECT p.*, u.nickname, assignee.nickname AS assignee_nickname,
         (SELECT COUNT(*) FROM hub_responses r WHERE r.post_id = p.id) AS response_count
  FROM hub_posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN users assignee ON assignee.id = p.assignee_id
`;

export function listHubPosts(filters: { q?: string; module?: HubModule | "ALL"; status?: string; limit?: number } = {}) {
  const clauses = ["p.moderation_status = 'APPROVED'", "u.status = 'ACTIVE'"];
  const params: Array<string | number> = [];
  if (filters.module && filters.module !== "ALL") {
    clauses.push("p.module = ?");
    params.push(filters.module);
  }
  if (filters.status && filters.status !== "ALL") {
    clauses.push("p.status = ?");
    params.push(filters.status);
  }
  if (filters.q) {
    clauses.push("(p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)");
    const q = `%${filters.q}%`;
    params.push(q, q, q);
  }
  params.push(filters.limit ?? 80);
  return queryAll<HubPost>(`${HUB_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY p.created_at DESC LIMIT ?`, params);
}

export function getHubPost(id: number, includeUnapproved = false) {
  const moderation = includeUnapproved ? "" : "AND p.moderation_status = 'APPROVED'";
  return queryOne<HubPost>(`${HUB_SELECT} WHERE p.id = ? ${moderation}`, [id]);
}

export function getHubResponses(postId: number) {
  return queryAll<HubResponse>(
    `SELECT r.*, u.nickname FROM hub_responses r JOIN users u ON u.id = r.user_id
     WHERE r.post_id = ? ORDER BY r.status = 'ACCEPTED' DESC, r.created_at DESC`,
    [postId],
  );
}

export function getHubResponseForUser(postId: number, userId: number) {
  return queryOne<{ id: number; status: string }>("SELECT id, status FROM hub_responses WHERE post_id = ? AND user_id = ?", [postId, userId]);
}

export function getHubPostsForUser(userId: number) {
  return queryAll<HubPost>(
    `${HUB_SELECT} WHERE p.user_id = ? OR p.assignee_id = ? ORDER BY p.created_at DESC`,
    [userId, userId],
  );
}

export function getPublicUser(id: number) {
  return queryOne<User>(
    `SELECT id, phone, nickname, name, gender, grade, major, campus, interests, bio, contact, role, status, created_at
     FROM users WHERE id = ?`,
    [id],
  );
}

export function getPublicUserOverview(id: number) {
  const stats = queryOne<{
    published_posts: number;
    completed_matches: number;
    average_rating: number | null;
    rating_count: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM buddy_posts WHERE user_id = ?) AS published_posts,
       (SELECT COUNT(*) FROM buddy_matches WHERE (owner_id = ? OR partner_id = ?) AND status = 'COMPLETED') AS completed_matches,
       (SELECT ROUND(AVG(rating), 1) FROM buddy_matches WHERE (owner_id = ? OR partner_id = ?) AND rating IS NOT NULL) AS average_rating,
       (SELECT COUNT(*) FROM buddy_matches WHERE (owner_id = ? OR partner_id = ?) AND rating IS NOT NULL) AS rating_count`,
    [id, id, id, id, id, id, id],
  );
  const posts = listBuddyPosts({ status: "ALL", limit: 60 }).filter((post) => post.user_id === id).slice(0, 6);
  return {
    stats: stats ?? { published_posts: 0, completed_matches: 0, average_rating: null, rating_count: 0 },
    posts,
  };
}

export function getAdminOverview() {
  return {
    users: queryAll<User & { post_count: number }>(
      `SELECT u.id, u.phone, u.nickname, u.name, u.gender, u.grade, u.major, u.campus, u.interests,
              u.bio, u.contact, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM buddy_posts b WHERE b.user_id = u.id) AS post_count
       FROM users u ORDER BY u.created_at DESC LIMIT 100`,
    ),
    posts: queryAll<HubPost>(`${HUB_SELECT} ORDER BY p.created_at DESC LIMIT 100`),
    reports: queryAll<{ id: number; reporter: string; target_type: string; target_id: number; reason: string; status: string; created_at: string }>(
      `SELECT r.*, u.nickname AS reporter FROM content_reports r JOIN users u ON u.id = r.reporter_id
       ORDER BY r.status = 'PENDING' DESC, r.created_at DESC LIMIT 100`,
    ),
  };
}

export function searchPlatform(query: string) {
  const q = `%${query}%`;
  return {
    buddies: queryAll<BuddyPost>(
      `${BUDDY_SELECT} WHERE p.status = 'OPEN' AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?) ORDER BY p.created_at DESC LIMIT 4`,
      [q, q, q],
    ),
    hub: queryAll<HubPost>(
      `${HUB_SELECT} WHERE p.moderation_status = 'APPROVED' AND p.status = 'OPEN'
       AND (p.title LIKE ? OR p.description LIKE ?) ORDER BY p.created_at DESC LIMIT 4`,
      [q, q],
    ),
  };
}
