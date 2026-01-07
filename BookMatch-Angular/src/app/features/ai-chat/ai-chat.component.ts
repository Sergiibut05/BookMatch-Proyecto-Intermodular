import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiChatService } from '@core/services/ai-chat.service';
import { AuthService } from '@core/services/auth.service';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  private aiChatService = inject(AiChatService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  
  messages = signal<ChatMessage[]>([]);
  currentMessage = signal('');
  isLoading = signal(false);
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    // Mensaje de bienvenida inicial
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      content: '¡Hola! 👋 Soy tu asistente de recomendación de libros. ¿Qué tipo de libro estás buscando hoy?',
      isUser: false,
      timestamp: new Date()
    };
    this.messages.set([welcomeMessage]);
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage(): void {
    const messageText = this.currentMessage().trim();
    if (!messageText || this.isLoading()) return;

    const user = this.authService.currentUser();
    if (!user?.id) {
      console.error('Usuario no autenticado');
      return;
    }

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMessage]);
    this.currentMessage.set('');
    this.isLoading.set(true);
    this.shouldScrollToBottom = true;

    // Obtener la URL base
    const baseUrl = this.getBaseUrl();

    // Enviar mensaje a la IA
    this.aiChatService.sendMessage(user.id, messageText, baseUrl).subscribe({
      next: (htmlResponse) => {
        console.log('✅ Respuesta HTML recibida:', htmlResponse);
        console.log('✅ Tipo de respuesta:', typeof htmlResponse);
        
        // Asegurarse de que la respuesta es un string
        const responseContent = typeof htmlResponse === 'string' ? htmlResponse : String(htmlResponse);
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          isUser: false,
          timestamp: new Date()
        };
        this.messages.update(msgs => [...msgs, aiMessage]);
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('❌ Error enviando mensaje:', error);
        console.error('❌ Error status:', error?.status);
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error error:', error?.error);
        
        let errorText = 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.';
        
        // Intentar obtener un mensaje de error más específico
        if (error?.error && typeof error.error === 'string') {
          errorText = error.error;
        } else if (error?.message) {
          errorText = `Error: ${error.message}`;
        }
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: errorText,
          isUser: false,
          timestamp: new Date()
        };
        this.messages.update(msgs => [...msgs, errorMessage]);
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
      }
    });
  }

  private getBaseUrl(): string {
    const currentUrl = window.location.origin;
    return currentUrl + '/';
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}

