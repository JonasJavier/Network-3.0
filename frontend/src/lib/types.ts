export interface UserMini {
  id: number
  username: string
  name: string
  headline: string
  avatar: string | null
}

export interface UserCard extends UserMini {
  is_following: boolean
  followers_count: number
}

export interface UserDetail extends UserCard {
  first_name: string
  last_name: string
  bio: string
  location: string
  website: string
  cover: string | null
  following_count: number
  posts_count: number
  date_joined: string
}

export interface Post {
  id: number
  author: UserMini
  content: string
  image: string | null
  created_at: string
  updated_at: string
  is_edited: boolean
  likes_count: number
  comments_count: number
  is_liked: boolean
}

export interface Comment {
  id: number
  post: number
  author: UserMini
  content: string
  created_at: string
  likes_count: number
  is_liked: boolean
  replies: Comment[]
}

export type NotificationVerb =
  | 'follow'
  | 'like_post'
  | 'comment'
  | 'reply'
  | 'like_comment'

export interface AppNotification {
  id: number
  actor: UserMini
  verb: NotificationVerb
  post: number | null
  comment: number | null
  post_preview: string
  is_read: boolean
  created_at: string
}

/** Cursor-paginated response (posts, notifications). */
export interface CursorPage<T> {
  next: string | null
  previous: string | null
  results: T[]
}

/** Page-number-paginated response (users, comments). */
export interface CountPage<T> extends CursorPage<T> {
  count: number
}

export interface LikeResponse {
  is_liked: boolean
  likes_count: number
}

export interface FollowResponse {
  is_following: boolean
  followers_count: number
}
