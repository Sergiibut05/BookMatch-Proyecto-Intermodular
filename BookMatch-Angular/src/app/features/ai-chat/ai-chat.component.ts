import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { marked } from 'marked';
import { firstValueFrom } from 'rxjs';
import { ConversationService } from '../../core/services/conversation.service';
import { AuthService } from '@core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service';
import { PlaylistService } from '@core/services/playlist.service';
import { ConversationUI, MessageUI } from '../../core/models/conversation.model';
import { CatalogBook } from '@shared/models';
import { Header } from '@shared/components/header/header';

/**
 * Grupo de conversaciones para mostrar en el sidebar agrupadas por fecha
 * (Hoy, Ayer, Esta semana, Anteriores).
 */
interface ConversationGroup {
  /** Clave i18n del grupo (AI_CHAT.GROUP_TODAY, etc.). */
  labelKey: string;
  /** Conversaciones del grupo. */
  items: ConversationUI[];
}

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
  private catalogService = inject(CatalogService);
  private playlistService = inject(PlaylistService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  /** Contenedor de mensajes para scroll. */
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  /** Textarea del input — usado para auto-resize. */
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

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

  // H2.3 · Cards de libros recomendados
  /** Mapa id→CatalogBook de las recomendaciones ya cargadas. */
  booksById = signal<Map<number, CatalogBook>>(new Map());
  /** Flag de "error al cargar libro" por id (para no reintentar en bucle). */
  private booksFailed = new Set<number>();
  /** Flag de "libro en carga" para evitar peticiones duplicadas. */
  private loadingBooks = new Set<number>();

  /**
   * Agrupa las conversaciones por franjas de fecha para el sidebar.
   * El orden original (más recientes primero) se respeta dentro de cada grupo.
   */
  readonly groupedConversations = computed<ConversationGroup[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

    const groups: Record<string, ConversationUI[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    for (const conv of this.conversations()) {
      const ts = conv.updatedAt?.getTime?.() ?? 0;
      if (ts >= startOfToday) groups['today'].push(conv);
      else if (ts >= startOfYesterday) groups['yesterday'].push(conv);
      else if (ts >= startOfWeek) groups['week'].push(conv);
      else groups['older'].push(conv);
    }

    const ordered: ConversationGroup[] = [
      { labelKey: 'AI_CHAT.GROUP_TODAY', items: groups['today'] },
      { labelKey: 'AI_CHAT.GROUP_YESTERDAY', items: groups['yesterday'] },
      { labelKey: 'AI_CHAT.GROUP_WEEK', items: groups['week'] },
      { labelKey: 'AI_CHAT.GROUP_OLDER', items: groups['older'] },
    ];

    return ordered.filter((g) => g.items.length > 0);
  });

  constructor() {
    // Cuando cambian los mensajes, pedimos al catálogo los libros recomendados
    // que aún no tengamos en cache. Esto alimenta las tarjetas de abajo de
    // cada respuesta del asistente.
    effect(() => {
      const ids = new Set<number>();
      for (const m of this.messages()) {
        if (m.role !== 'assistant' || m.status === 'processing') continue;
        for (const id of this.recommendationIds(m)) ids.add(id);
      }
      ids.forEach((id) => this.ensureBookLoaded(id));
    });
  }

  /** Comprueba auth, carga conversaciones y deja mensajes vacíos. */
  ngOnInit() {
    const firebaseUser = this.authService.firebaseUser();
    if (!firebaseUser?.uid) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadConversations(firebaseUser.uid);
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
      }
    );
  }

  /** Selecciona una conversación y carga sus mensajes. */
  selectConversation(conversationId: string, closeSidebar: boolean = true) {
    this.activeConversationId.set(conversationId);
    this.isNewEmptyConversation.set(false);
    if (closeSidebar) {
      this.showSidebarMobile.set(false);
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

    if (this.isNewEmptyConversation() || !this.activeConversationId()) {
      this.isLoading.set(true);
      this.currentMessage.set('');
      this.resetTextareaHeight();

      this.conversationService.createConversation(firebaseUser.uid).subscribe({
        next: (conversationId) => {
          this.selectConversation(conversationId, false);
          this.sendMessageToConversation(firebaseUser.uid, conversationId, content);
        },
        error: (error) => {
          console.error('Error creating conversation:', error);
          this.isLoading.set(false);
          this.currentMessage.set(content);
        }
      });
    } else {
      this.sendMessageToConversation(firebaseUser.uid, this.activeConversationId()!, content);
    }
  }

  private sendMessageToConversation(userId: string, conversationId: string, content: string) {
    this.isLoading.set(true);
    this.currentMessage.set('');
    this.resetTextareaHeight();
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

  /** Rellena el input con la sugerencia y enfoca el textarea. */
  useSuggestion(suggestion: string) {
    this.currentMessage.set(suggestion);
    queueMicrotask(() => {
      try {
        this.messageInput?.nativeElement.focus();
        this.autoResizeTextarea();
      } catch {}
    });
  }

  /** Convierte markdown a HTML (GFM, sin sanitización extra — la IA es la única fuente). */
  renderMarkdown(content: string): string {
    return marked.parse(content, { gfm: true, breaks: true }) as string;
  }

  /** Envía el mensaje con Enter (sin Shift). */
  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Ajusta la altura del textarea al contenido hasta un máximo de 6 líneas
   * aprox. (180px). Llamar en `(input)` y tras limpiar el valor.
   */
  autoResizeTextarea(): void {
    const el = this.messageInput?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    const maxPx = 180;
    el.style.height = Math.min(el.scrollHeight, maxPx) + 'px';
  }

  private resetTextareaHeight(): void {
    const el = this.messageInput?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
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
   * Devuelve el libro cacheado o `null` si aún no ha llegado.
   * La carga la dispara el `effect()` del constructor.
   */
  getRecommendedBook(id: number): CatalogBook | null {
    return this.booksById().get(id) ?? null;
  }

  /** Carga perezosa de un libro por ID, con deduplicación. */
  private ensureBookLoaded(id: number): void {
    if (this.booksById().has(id) || this.loadingBooks.has(id) || this.booksFailed.has(id)) {
      return;
    }
    this.loadingBooks.add(id);
    this.catalogService.getBookById(id).subscribe({
      next: (book) => {
        const next = new Map(this.booksById());
        next.set(id, book);
        this.booksById.set(next);
        this.loadingBooks.delete(id);
      },
      error: () => {
        this.booksFailed.add(id);
        this.loadingBooks.delete(id);
      },
    });
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

  /** Expone el usuario actual al template (avatar, nombre). */
  get currentUser() {
    return this.authService.currentUser();
  }
}
