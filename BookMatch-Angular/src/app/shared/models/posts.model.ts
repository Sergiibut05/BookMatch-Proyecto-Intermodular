/**
 * Interfaces para posts/temas del foro
 */

export interface PostAuthor {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
}

export type VoteType = 'UP' | 'DOWN';

export interface Post {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  forumId: number;
  authorId: number;
  score: number;
  author?: PostAuthor;
  userVote?: VoteType | null; // Voto del usuario actual para este post
  _count?: {
    comments: number;
    votes: number;
  };
}

export interface PostsListResponse {
  items: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePostDto {
  title: string;
  content: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
}

