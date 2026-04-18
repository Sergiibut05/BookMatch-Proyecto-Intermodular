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

