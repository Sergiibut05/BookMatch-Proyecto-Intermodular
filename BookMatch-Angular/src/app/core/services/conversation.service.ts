import { Injectable, inject } from '@angular/core';
import { 
  Firestore, collection, addDoc, query, where, 
  orderBy, doc, updateDoc, Timestamp,
  collectionData, serverTimestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Conversation, Message, ConversationUI, MessageUI } from '../models/conversation.model';

/**
 * Servicio de conversaciones con IA: crea y lista conversaciones en Firestore,
 * obtiene mensajes, envía mensajes al backend y archiva conversaciones.
 */
@Injectable({ providedIn: 'root' })
export class ConversationService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  /**
   * Crea una nueva conversación para el usuario en Firestore.
   * @param userId Firebase UID del usuario
   * @returns Observable con el ID del documento creado
   */
  createConversation(userId: string): Observable<string> {
    const conversationsRef = collection(
      this.firestore, 
      `users/${userId}/conversations`
    );
    
    const newConversation: Omit<Conversation, 'id'> = {
      userId,
      title: 'Nueva conversación',
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      messageCount: 0,
      status: 'active'
    };

    return from(addDoc(conversationsRef, newConversation)).pipe(
      map(docRef => docRef.id)
    );
  }

  /**
   * Obtiene las conversaciones activas del usuario ordenadas por fecha de actualización.
   * @param userId Firebase UID del usuario
   * @returns Observable con lista de conversaciones para UI (fechas como Date)
   */
  getConversations(userId: string): Observable<ConversationUI[]> {
    const conversationsRef = collection(
      this.firestore, 
      `users/${userId}/conversations`
    );
    const q = query(
      conversationsRef, 
      where('status', '==', 'active'),
      orderBy('updatedAt', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map(conversations => conversations.map(conv => ({
        ...conv,
        createdAt: (conv['createdAt'] as Timestamp).toDate(),
        updatedAt: (conv['updatedAt'] as Timestamp).toDate()
      })) as ConversationUI[])
    );
  }

  /**
   * Obtiene los mensajes de una conversación ordenados por timestamp.
   * @param userId Firebase UID del usuario
   * @param conversationId ID del documento de conversación
   * @returns Observable con mensajes para UI (timestamp como Date)
   */
  getMessages(userId: string, conversationId: string): Observable<MessageUI[]> {
    const messagesRef = collection(
      this.firestore,
      `users/${userId}/conversations/${conversationId}/messages`
    );
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map(messages => messages.map(msg => ({
        ...msg,
        timestamp: (msg['timestamp'] as Timestamp).toDate()
      })) as MessageUI[])
    );
  }

  /**
   * Envía un mensaje del usuario al backend (procesamiento IA).
   * @param userId Firebase UID del usuario
   * @param conversationId ID de la conversación
   * @param content Texto del mensaje
   * @returns Observable que completa cuando el mensaje se envió
   */
  sendMessage(userId: string, conversationId: string, content: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/ai-chat/send-message`,
      { userId, conversationId, content }
    );
  }

  /**
   * Archiva una conversación (cambia status a 'archived' en Firestore).
   * @param userId Firebase UID del usuario
   * @param conversationId ID de la conversación
   * @returns Observable que completa cuando se actualizó
   */
  archiveConversation(userId: string, conversationId: string): Observable<void> {
    const conversationRef = doc(
      this.firestore,
      `users/${userId}/conversations/${conversationId}`
    );
    return from(updateDoc(conversationRef, { 
      status: 'archived',
      updatedAt: serverTimestamp()
    }));
  }

  /**
   * Renombra una conversación (H2.1).
   * Normaliza el título (trim), rechaza vacío o >80 caracteres y actualiza
   * también `updatedAt` para que suba en la lista.
   *
   * @param userId Firebase UID del usuario
   * @param conversationId ID de la conversación
   * @param title Nuevo título (1..80 caracteres tras trim)
   * @returns Observable que completa cuando se actualizó
   */
  updateTitle(
    userId: string,
    conversationId: string,
    title: string,
  ): Observable<void> {
    const normalized = (title ?? '').trim().replace(/\s+/g, ' ');
    if (!normalized || normalized.length > 80) {
      const err = new Error('INVALID_TITLE');
      return from(Promise.reject(err));
    }
    const conversationRef = doc(
      this.firestore,
      `users/${userId}/conversations/${conversationId}`,
    );
    return from(
      updateDoc(conversationRef, {
        title: normalized,
        updatedAt: serverTimestamp(),
      }),
    );
  }
}

