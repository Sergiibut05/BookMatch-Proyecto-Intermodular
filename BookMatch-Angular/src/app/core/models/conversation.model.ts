import { Timestamp } from '@angular/fire/firestore';

export interface DetectedLanguage {
  lang: string;        // "es", "en", "fr"
  langFull: string;    // "Español", "English", "Français"
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  status: 'active' | 'archived';
  detectedLanguage?: DetectedLanguage;
}

export interface MessageMetadata {
  // Para mensajes de assistant
  thoughts?: string[];           // Razonamiento interno de la IA
  recommendations?: string[];    // IDs de libros recomendados
  used_querys?: string[];       // Queries SQL ejecutadas
  
  // Campos adicionales según necesidad
  intentType?: 'book_recommendation' | 'casual_chat' | 'out_of_scope';
  processingTime?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;              // Texto del mensaje (markdown para assistant)
  timestamp: Timestamp;
  status: 'sending' | 'processing' | 'completed' | 'error';
  metadata?: MessageMetadata;
}

// Para el frontend (convertido de Firestore)
export interface ConversationUI extends Omit<Conversation, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageUI extends Omit<Message, 'timestamp'> {
  timestamp: Date;
}

