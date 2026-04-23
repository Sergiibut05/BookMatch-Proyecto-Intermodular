import { Timestamp } from '@angular/fire/firestore';

/** Idioma detectado en la conversación: código (es, en, fr) y nombre completo. */
export interface DetectedLanguage {
  /** Código del idioma. */
  lang: string;
  /** Nombre completo del idioma. */
  langFull: string;
}

/**
 * Conversación en Firestore: pertenece a un usuario, tiene título, fechas y estado.
 * status 'active' o 'archived'; detectedLanguage opcional.
 */
export interface Conversation {
  /** ID del documento en Firestore. */
  id: string;
  /** Firebase UID del usuario. */
  userId: string;
  /** Título de la conversación. */
  title: string;
  /** Fecha de creación (Timestamp Firestore). */
  createdAt: Timestamp;
  /** Fecha de última actualización. */
  updatedAt: Timestamp;
  /** Número de mensajes. */
  messageCount: number;
  /** Estado active o archived. */
  status: 'active' | 'archived';
  /** Idioma detectado opcional. */
  detectedLanguage?: DetectedLanguage;
}

/**
 * Ítem de un borrador de playlist conversacional.
 * El LLM devuelve el borrador completo cada turno; el frontend lo renderiza
 * en un panel visual y permite guardar la playlist al final.
 */
export interface PlaylistDraftItem {
  /** ID del libro del catálogo (backend Postgres). */
  catalogBookId: number;
  /** Posición 1-based dentro de la playlist. */
  position: number;
  /** Nota opcional del curador (máx. 200 chars). */
  note?: string | null;
}

/** Borrador de playlist generado por la IA en modo conversacional. */
export interface PlaylistDraft {
  /** Título propuesto (3-6 palabras). */
  title: string;
  /** Descripción corta (1-2 frases). */
  description?: string;
  /** Lista ordenada de libros. */
  items: PlaylistDraftItem[];
}

/**
 * Metadatos de un mensaje del asistente: razonamiento, recomendaciones, queries usadas,
 * tipo de intención y tiempo de procesamiento.
 */
export interface MessageMetadata {
  /** Razonamiento interno de la IA. */
  thoughts?: string[];
  /**
   * IDs de libros recomendados (CatalogBook.id). Aceptamos `number | string`
   * por compatibilidad con workflows antiguos que los emitían como strings;
   * la UI normaliza a número antes de usarlos (ver H1.10 / SCRUM-169).
   */
  recommendations?: Array<number | string>;
  /** Queries SQL usadas. */
  used_querys?: string[];
  /** Tipo de intención detectada. */
  intentType?: 'book_recommendation' | 'casual_chat' | 'out_of_scope';
  /** Tiempo de procesamiento en ms. */
  processingTime?: number;
  /** Modo en que se envió el mensaje del usuario. */
  mode?: 'chat' | 'playlist_builder';
  /** Máximo de libros para esta iteración (modo playlist). */
  maxItems?: number;
  /** Borrador de playlist (solo en modo playlist_builder). */
  playlistDraft?: PlaylistDraft;
}

/**
 * Mensaje en una conversación: rol user/assistant, contenido (markdown en assistant),
 * timestamp Firestore y estado (sending, processing, completed, error).
 */
export interface Message {
  /** ID del mensaje. */
  id: string;
  /** ID de la conversación. */
  conversationId: string;
  /** Rol user o assistant. */
  role: 'user' | 'assistant';
  /** Texto del mensaje (markdown en assistant). */
  content: string;
  /** Fecha/hora Firestore. */
  timestamp: Timestamp;
  /** Estado del mensaje. */
  status: 'sending' | 'processing' | 'completed' | 'error';
  /** Metadatos del asistente. */
  metadata?: MessageMetadata;
}

/**
 * Conversación con fechas convertidas a Date para uso en UI (Firestore devuelve Timestamp).
 */
export interface ConversationUI extends Omit<Conversation, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mensaje con timestamp convertido a Date para uso en UI.
 */
export interface MessageUI extends Omit<Message, 'timestamp'> {
  timestamp: Date;
}

