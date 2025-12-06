/**
 * Interfaces para comentarios
 */

export interface CommentAuthor {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  postId: number;
  authorId: number;
  parentId: number | null;
  author?: CommentAuthor;
  children?: Comment[]; // Comentarios anidados (respuestas)
}

export interface CreateCommentDto {
  content: string;
  parentId?: number;
}

export interface UpdateCommentDto {
  content?: string;
}

