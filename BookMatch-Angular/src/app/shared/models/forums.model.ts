/**
 * Interfaces para foros
 */

export interface ForumCreator {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Forum {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: number;
  creator?: ForumCreator;
  _count?: {
    posts: number;
  };
}

export interface ForumsListResponse {
  items: Forum[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateForumDto {
  title: string;
  description?: string;
}

export interface UpdateForumDto {
  title?: string;
  description?: string;
}

