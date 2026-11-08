export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "DISABLED";
export type BuddyStatus = "OPEN" | "MATCHED" | "CLOSED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CLEARED";
export type MatchStatus = "ACTIVE" | "COMPLETED";
export type HubModule = "PURCHASE" | "SECOND_HAND" | "ERRAND" | "RENTAL" | "COURSE_SWAP" | "QUESTION";
export type HubStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "CLOSED";

export interface User {
  id: number;
  phone: string;
  nickname: string;
  name: string;
  gender: string;
  grade: string;
  major: string;
  campus: string;
  interests: string;
  bio: string;
  contact: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface BuddyPost {
  id: number;
  user_id: number;
  title: string;
  category: string;
  description: string;
  expected_count: number;
  location: string;
  activity_time: string;
  contact: string;
  tags: string;
  status: BuddyStatus;
  view_count: number;
  created_at: string;
  updated_at: string;
  nickname: string;
  grade: string;
  major: string;
  interests: string;
  author_bio: string;
  accepted_count: number;
  comment_count: number;
  favorite_count: number;
  match_score?: number;
  match_reasons?: string[];
}

export interface BuddyApplication {
  id: number;
  post_id: number;
  applicant_id: number;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  decided_at: string | null;
  post_title: string;
  post_category: string;
  owner_id: number;
  owner_nickname: string;
  applicant_nickname: string;
  applicant_grade: string;
  applicant_major: string;
  applicant_interests: string;
}

export interface BuddyMatch {
  id: number;
  post_id: number;
  owner_id: number;
  partner_id: number;
  category: string;
  status: MatchStatus;
  rating: number | null;
  feedback: string;
  created_at: string;
  completed_at: string | null;
  post_title: string;
  other_user_id: number;
  other_nickname: string;
  other_contact: string;
  other_major: string;
  unread_count: number;
}

export interface BuddyMessage {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  is_read: number;
  created_at: string;
  sender_nickname: string;
}

export interface ManagedBuddyPost extends BuddyPost {
  pending_count: number;
}

export interface BuddyComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  nickname: string;
}

export interface HubPost {
  id: number;
  user_id: number;
  module: HubModule;
  title: string;
  description: string;
  price: number | null;
  location: string;
  contact: string;
  metadata: string;
  status: HubStatus;
  moderation_status: "PENDING" | "APPROVED" | "REJECTED";
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
  nickname: string;
  assignee_nickname: string | null;
  response_count: number;
}

export interface HubResponse {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
  nickname: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  href: string;
  is_read: number;
  created_at: string;
}
