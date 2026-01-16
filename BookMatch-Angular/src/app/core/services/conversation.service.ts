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

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

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

  sendMessage(userId: string, conversationId: string, content: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/ai-chat/send-message`,
      { userId, conversationId, content }
    );
  }

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
}

