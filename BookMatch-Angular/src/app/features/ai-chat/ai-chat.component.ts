import { Component, OnInit, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marked } from 'marked';
import { firstValueFrom } from 'rxjs';
import { ConversationService } from '../../core/services/conversation.service';
import { AuthService } from '@core/services/auth.service';
import { PlaylistService } from '@core/services/playlist.service';
import { ConversationUI, MessageUI } from '../../core/models/conversation.model';
import { Header } from '@shared/components/header/header';

/**
 * Chat con IA: lista de conversaciones, mensajes en hilo y envío.
 * Requiere usuario autenticado; usa ConversationService y Firestore.
 */
@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, Header],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss'
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  private conversationService = inject(ConversationService);
  private authService = inject(AuthService);
  private playlistService = inject(PlaylistService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  /** Contenedor de mensajes para scroll. */
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  /** Lista de conversaciones del usuario. */
  conversations = signal<ConversationUI[]>([]);
  /** ID de la conversación activa. */
  activeConversationId = signal<string | null>(null);
  /** Mensajes de la conversación activa. */
  messages = signal<MessageUI[]>([]);
  /** Texto del input de mensaje. */
  currentMessage = signal('');
  /** Enviando o cargando. */
  isLoading = signal(false);
  /** Sidebar de conversaciones visible en móvil. */
  showSidebarMobile = signal(false);
  /** True si es conversación nueva aún no creada en backend. */
  isNewEmptyConversation = signal(true);

  private shouldScrollToBottom = false;

  /** ID del mensaje del asistente que se está guardando como playlist (o null). */
  savingPlaylistForMessageId = signal<string | null>(null);
  /** Toast con la playlist recién guardada desde el chat (o null). */
  savedPlaylistToast = signal<{ id: number; title: string } | null>(null);
  private savedToastTimer: ReturnType<typeof setTimeout> | null = null;

  // H2.1 · Rename inline
  /** ID de la conversación actualmente en modo edición (o null). */
  editingConversationId = signal<string | null>(null);
  /** Borrador del título mientras se edita. */
  titleDraft = signal<string>('');
  /** Flag para evitar doble guardado por blur + enter simultáneos. */
  private savingTitle = false;

  // H2.2 · Delete/archive
  /** ID de la conversación actualmente siendo archivada (loading). */
  archivingConversationId = signal<string | null>(null);

  /** Comprueba auth, carga conversaciones y deja mensajes vacíos. */
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

  /** Hace scroll al final si se solicitó. */
  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /** Carga la lista de conversaciones del usuario. */
  loadConversations(userId: string) {
    this.conversationService.getConversations(userId).subscribe(
      conversations => {
        this.conversations.set(conversations);
        // NO seleccionar automáticamente la primera conversación
        // El usuario empieza con una conversación vacía
      }
    );
  }

  /** Selecciona una conversación y carga sus mensajes. */
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

  /** Crea una conversación vacía en UI (sin guardar aún). */
  createNewConversation() {
    // Limpiar la conversación actual y mostrar una vacía
    this.activeConversationId.set(null);
    this.messages.set([]);
    this.isNewEmptyConversation.set(true);
    this.showSidebarMobile.set(false);
    }

  /** Envía el mensaje actual (crea conversación si es nueva). */
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

  /** Alterna la visibilidad del sidebar en móvil. */
  toggleSidebarMobile() {
    this.showSidebarMobile.update(value => !value);
  }

  /** Rellena el input con la sugerencia. */
  useSuggestion(suggestion: string) {
    this.currentMessage.set(suggestion);
  }

  /** Convierte markdown a HTML. */
  renderMarkdown(content: string): string {
    return marked.parse(content) as string;
  }

  /** Envía el mensaje con Enter (sin Shift). */
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

  /**
   * Normaliza los IDs de `metadata.recommendations` a números enteros positivos.
   * Acepta tanto strings como números (compat con workflows n8n antiguos).
   */
  recommendationIds(msg: MessageUI): number[] {
    const raw = msg.metadata?.recommendations ?? [];
    const parsed = raw
      .map((value) => (typeof value === 'number' ? value : Number(value)))
      .filter((id): id is number => Number.isFinite(id) && id > 0);
    return Array.from(new Set(parsed));
  }

  /** True si el mensaje del asistente trae recomendaciones válidas. */
  hasRecommendations(msg: MessageUI): boolean {
    return this.recommendationIds(msg).length > 0;
  }

  /**
   * Crea una playlist a partir de las recomendaciones del mensaje del asistente.
   * Usa como `aiPrompt` el último mensaje del usuario para contexto.
   */
  async saveAsPlaylist(msg: MessageUI): Promise<void> {
    if (this.savingPlaylistForMessageId() === msg.id) return;

    const itemIds = this.recommendationIds(msg);
    if (itemIds.length === 0) return;

    this.savingPlaylistForMessageId.set(msg.id);

    const lastUserMessage = [...this.messages()]
      .filter((m) => m.role === 'user')
      .pop();
    const aiPrompt = lastUserMessage?.content ?? null;

    const title = this.buildPlaylistTitle(lastUserMessage?.content);

    try {
      const playlist = await firstValueFrom(
        this.playlistService.create({
          title,
          description: aiPrompt
            ? `Generada desde el chat: "${aiPrompt.slice(0, 140)}"`
            : null,
          visibility: 'PRIVATE',
          source: 'AI',
          aiPrompt,
          itemIds,
        }),
      );
      this.showSavedPlaylistToast(playlist.id, playlist.title);
    } catch (err) {
      console.error('[ai-chat] error guardando playlist', err);
      window.alert('No se ha podido guardar la playlist.');
    } finally {
      this.savingPlaylistForMessageId.set(null);
    }
  }

  /** Construye un título legible a partir del último mensaje del usuario. */
  private buildPlaylistTitle(seed: string | undefined): string {
    const cleaned = (seed ?? '').trim().replace(/\s+/g, ' ');
    const base =
      cleaned.length >= 3
        ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        : 'Recomendaciones del chat';
    const truncated = base.length > 60 ? base.slice(0, 57).trimEnd() + '...' : base;
    return truncated;
  }

  /** Muestra el toast de playlist guardada con auto-dismiss a los 6s. */
  private showSavedPlaylistToast(id: number, title: string): void {
    this.savedPlaylistToast.set({ id, title });
    if (this.savedToastTimer) clearTimeout(this.savedToastTimer);
    this.savedToastTimer = setTimeout(() => {
      this.savedPlaylistToast.set(null);
      this.savedToastTimer = null;
    }, 6000);
  }

  /** Cierre manual del toast. */
  dismissSavedPlaylistToast(): void {
    if (this.savedToastTimer) clearTimeout(this.savedToastTimer);
    this.savedToastTimer = null;
    this.savedPlaylistToast.set(null);
  }

  // ============================================================
  // H2.1 · Renombrar conversación
  // ============================================================

  /**
   * Activa el modo edición inline del título de la conversación indicada.
   * Detiene la propagación para que el `click` del item no cambie la
   * conversación activa.
   */
  startEditingTitle(conv: ConversationUI, event?: Event): void {
    event?.stopPropagation();
    this.editingConversationId.set(conv.id);
    this.titleDraft.set(conv.title ?? '');
  }

  /** Cancela la edición sin persistir cambios. */
  cancelEditingTitle(event?: Event): void {
    event?.stopPropagation();
    this.editingConversationId.set(null);
    this.titleDraft.set('');
  }

  /**
   * Guarda el nuevo título en Firestore. Valida 1..80 caracteres tras trim.
   * Si está vacío o excede la longitud → cancela sin tocar Firestore.
   * Si no ha cambiado → también cancela sin llamar a la red.
   */
  async saveEditedTitle(conv: ConversationUI, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (this.savingTitle) return;

    const firebaseUser = this.authService.firebaseUser();
    const next = this.titleDraft().trim();

    if (
      !firebaseUser?.uid ||
      !next ||
      next.length > 80 ||
      next === (conv.title ?? '').trim()
    ) {
      this.cancelEditingTitle();
      return;
    }

    this.savingTitle = true;
    try {
      await firstValueFrom(
        this.conversationService.updateTitle(firebaseUser.uid, conv.id, next),
      );
    } catch (err) {
      console.error('[ai-chat] error renombrando conversación', err);
    } finally {
      this.savingTitle = false;
      this.editingConversationId.set(null);
      this.titleDraft.set('');
    }
  }

  /**
   * Handlers de teclado sobre el input de edición.
   * Enter guarda; Escape cancela.
   */
  onEditTitleKeydown(event: KeyboardEvent, conv: ConversationUI): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      void this.saveEditedTitle(conv, event);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancelEditingTitle(event);
    }
  }

  // ============================================================
  // H2.2 · Archivar (soft-delete) conversación
  // ============================================================

  /**
   * Confirma con el usuario y archiva la conversación. Si era la activa,
   * limpia el panel para volver al estado "new empty". La lista se
   * actualiza sola porque `getConversations` filtra por `status=active`.
   */
  async archiveConversation(conv: ConversationUI, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (this.archivingConversationId() === conv.id) return;

    const firebaseUser = this.authService.firebaseUser();
    if (!firebaseUser?.uid) return;

    const msg = this.translate.instant('AI_CHAT.DELETE_CONFIRM', {
      title: conv.title,
    });
    if (!window.confirm(msg)) return;

    this.archivingConversationId.set(conv.id);
    try {
      await firstValueFrom(
        this.conversationService.archiveConversation(firebaseUser.uid, conv.id),
      );
      if (this.activeConversationId() === conv.id) {
        this.activeConversationId.set(null);
        this.messages.set([]);
        this.isNewEmptyConversation.set(true);
      }
    } catch (err) {
      console.error('[ai-chat] error archivando conversación', err);
    } finally {
      this.archivingConversationId.set(null);
    }
  }
}
