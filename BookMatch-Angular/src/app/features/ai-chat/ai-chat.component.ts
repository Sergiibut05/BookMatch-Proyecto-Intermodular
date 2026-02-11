import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { marked } from 'marked';
import { ConversationService } from '../../core/services/conversation.service';
import { AuthService } from '@core/services/auth.service';
import { ConversationUI, MessageUI } from '../../core/models/conversation.model';
import { Header } from '@shared/components/header/header';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, Header],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  private conversationService = inject(ConversationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  
  // Signals
  conversations = signal<ConversationUI[]>([]);
  activeConversationId = signal<string | null>(null);
  messages = signal<MessageUI[]>([]);
  currentMessage = signal('');
  isLoading = signal(false);
  showSidebarMobile = signal(false);
  isNewEmptyConversation = signal(true); // Para saber si es una conversación nueva sin crear
  
  private shouldScrollToBottom = false;

  ngOnInit() {
    const firebaseUser = this.authService.firebaseUser();
    if (!firebaseUser?.uid) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadConversations(firebaseUser.uid);
    // Empezar con una conversación vacía (no creada aún)
    this.isNewEmptyConversation.set(true);
    this.messages.set([]);
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadConversations(userId: string) {
    this.conversationService.getConversations(userId).subscribe(
      conversations => {
        this.conversations.set(conversations);
        // NO seleccionar automáticamente la primera conversación
        // El usuario empieza con una conversación vacía
      }
    );
  }
  
  selectConversation(conversationId: string, closeSidebar: boolean = true) {
    this.activeConversationId.set(conversationId);
    this.isNewEmptyConversation.set(false);
    if (closeSidebar) {
      this.showSidebarMobile.set(false); // Cerrar sidebar en móvil al seleccionar
    }
    const firebaseUser = this.authService.firebaseUser();
    if (firebaseUser?.uid) {
      this.conversationService.getMessages(firebaseUser.uid, conversationId).subscribe(
        messages => {
          this.messages.set(messages);
          this.shouldScrollToBottom = true;
        }
      );
    }
  }
  
  createNewConversation() {
    // Limpiar la conversación actual y mostrar una vacía
    this.activeConversationId.set(null);
    this.messages.set([]);
    this.isNewEmptyConversation.set(true);
    this.showSidebarMobile.set(false);
    }

  sendMessage() {
    const firebaseUser = this.authService.firebaseUser();
    const content = this.currentMessage().trim();
    
    if (!firebaseUser?.uid || !content) return;
    
    // Si es una conversación nueva, crearla primero
    if (this.isNewEmptyConversation() || !this.activeConversationId()) {
      this.isLoading.set(true);
      this.currentMessage.set(''); // Limpiar input inmediatamente
      
      this.conversationService.createConversation(firebaseUser.uid).subscribe({
        next: (conversationId) => {
          // Seleccionar la conversación (esto suscribe a los mensajes)
          // No cerramos el sidebar porque estamos creando una nueva
          this.selectConversation(conversationId, false);
          // Ahora enviar el mensaje
          this.sendMessageToConversation(firebaseUser.uid, conversationId, content);
        },
        error: (error) => {
          console.error('Error creating conversation:', error);
          this.isLoading.set(false);
          this.currentMessage.set(content); // Restaurar mensaje en caso de error
        }
      });
    } else {
      // Conversación ya existe, solo enviar mensaje
      this.sendMessageToConversation(firebaseUser.uid, this.activeConversationId()!, content);
    }
  }
  
  private sendMessageToConversation(userId: string, conversationId: string, content: string) {
    this.isLoading.set(true);
    this.currentMessage.set('');
    this.shouldScrollToBottom = true;

    this.conversationService.sendMessage(userId, conversationId, content).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleSidebarMobile() {
    this.showSidebarMobile.update(value => !value);
  }
  
  useSuggestion(suggestion: string) {
    this.currentMessage.set(suggestion);
  }
  
  renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}
