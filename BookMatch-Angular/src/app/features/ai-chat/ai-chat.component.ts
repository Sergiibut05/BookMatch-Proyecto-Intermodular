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
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { marked } from 'marked';
import { firstValueFrom } from 'rxjs';
import { ConversationService } from '../../core/services/conversation.service';
import { AuthService } from '@core/services/auth.service';
import { CatalogService } from '@core/services/catalog.service';
import { PlaylistService } from '@core/services/playlist.service';
import {
  ConversationUI,
  MessageUI,
  PlaylistDraft,
  PlaylistDraftItem,
} from '../../core/models/conversation.model';
import { CatalogBook } from '@shared/models';

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
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, DragDropModule],
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
  /** Sidebar colapsado en desktop (persistido en localStorage). */
  sidebarCollapsedDesktop = signal<boolean>(this.readSidebarPreference());
  /** True si es conversación nueva aún no creada en backend. */
  isNewEmptyConversation = signal(true);

  // ============================================================
  // H1.x · Modo "Construir playlist" conversacional (Bloque C)
  // ------------------------------------------------------------
  // El usuario activa el toggle y la IA pasa a co-curar una
  // playlist de ~8 libros (configurable) a través de la
  // conversación. El último mensaje del asistente con
  // `metadata.playlistDraft` define el borrador visible.
  // Si el usuario reordena/elimina manualmente, guardamos una
  // "override" local que prevalece sobre el draft del último
  // mensaje hasta que llegue uno nuevo.
  // ============================================================
  /** Modo actual del chat. */
  playlistMode = signal<boolean>(false);
  /** Panel del borrador visible/oculto (desktop y móvil). */
  playlistPanelOpen = signal<boolean>(false);
  /**
   * Override local del borrador tras reorder/delete manual. Se limpia
   * cuando llega un nuevo `playlistDraft` desde el asistente.
   */
  private manualDraftOverride = signal<PlaylistDraft | null>(null);
  /** ID del último mensaje con playlistDraft que vimos (para limpiar override). */
  private lastDraftMessageId: string | null = null;
  /** Guardando la playlist definitiva a backend. */
  savingFinalPlaylist = signal<boolean>(false);

  /**
   * Último borrador de playlist vigente: override manual si existe, o el
   * draft del último mensaje del asistente. Null si no hay ninguno.
   */
  readonly currentPlaylistDraft = computed<PlaylistDraft | null>(() => {
    const override = this.manualDraftOverride();
    if (override) return override;
    const msgs = this.messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      const m = msgs[i];
      if (m.role === 'assistant' && m.metadata?.playlistDraft) {
        return m.metadata.playlistDraft;
      }
    }
    return null;
  });

  /** Dictado por voz: flag de grabación activa. */
  isRecording = signal(false);
  /** Dictado por voz: true si el navegador soporta Web Speech API. */
  readonly voiceInputSupported: boolean =
    typeof window !== 'undefined' &&
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  /** Instancia interna de SpeechRecognition (tipada laxamente, depende del navegador). */
  private recognition: any = null;

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

  /** Conversación activa actualmente (o null si es nueva/vacía). */
  readonly activeConversation = computed<ConversationUI | null>(() => {
    const id = this.activeConversationId();
    if (!id) return null;
    return this.conversations().find((c) => c.id === id) ?? null;
  });

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
        // También pre-cargamos los libros del borrador de playlist en curso
        // para que el panel los muestre sin parpadeo.
        const draft = m.metadata?.playlistDraft;
        if (draft?.items) {
          for (const it of draft.items) {
            if (Number.isFinite(it.catalogBookId) && it.catalogBookId > 0) {
              ids.add(it.catalogBookId);
            }
          }
        }
      }
      ids.forEach((id) => this.ensureBookLoaded(id));
    });

    // Cuando llega un nuevo `playlistDraft` desde el asistente (mensaje con
    // ID distinto al último que procesamos), descartamos el override manual
    // y abrimos el panel automáticamente si está en modo playlist.
    effect(() => {
      const msgs = this.messages();
      let latestDraftMsgId: string | null = null;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant' && msgs[i].metadata?.playlistDraft) {
          latestDraftMsgId = msgs[i].id;
          break;
        }
      }
      if (latestDraftMsgId && latestDraftMsgId !== this.lastDraftMessageId) {
        this.lastDraftMessageId = latestDraftMsgId;
        this.manualDraftOverride.set(null);
        if (this.playlistMode()) {
          this.playlistPanelOpen.set(true);
        }
      }
    });
  }

  // ============================================================
  // Modo "Construir playlist" conversacional
  // ============================================================

  /** Alterna el modo playlist. Al desactivarlo cerramos el panel. */
  togglePlaylistMode(): void {
    const next = !this.playlistMode();
    this.playlistMode.set(next);
    if (!next) this.playlistPanelOpen.set(false);
  }

  /** Abre/cierra el panel de borrador manualmente. */
  togglePlaylistPanel(): void {
    this.playlistPanelOpen.update((v) => !v);
  }

  // ============================================================
  // Drag-to-close del bottom sheet (solo móvil).
  // ------------------------------------------------------------
  // Usamos el handle como zona de gesto: al arrastrar el panel
  // hacia abajo, aplicamos translateY en vivo; al soltar, si se
  // superó el threshold (90px) lo cerramos, si no volvemos a su
  // sitio. Si no hubo arrastre apreciable, el click del botón
  // sigue funcionando (cierre con un simple tap).
  // ============================================================
  private sheetDragStartY: number | null = null;
  private sheetDragLastDelta = 0;

  private getPanelEl(target: EventTarget | null): HTMLElement | null {
    const start = target instanceof HTMLElement ? target : null;
    return start ? (start.closest('.playlist-panel') as HTMLElement | null) : null;
  }

  onPanelSheetTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    this.sheetDragStartY = touch.clientY;
    this.sheetDragLastDelta = 0;
    const panel = this.getPanelEl(event.currentTarget);
    if (panel) panel.classList.add('is-dragging');
  }

  onPanelSheetTouchMove(event: TouchEvent): void {
    if (this.sheetDragStartY == null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const delta = Math.max(0, touch.clientY - this.sheetDragStartY);
    this.sheetDragLastDelta = delta;
    const panel = this.getPanelEl(event.currentTarget);
    if (panel) panel.style.transform = `translateY(${delta}px)`;
    // Si hay arrastre real evitamos que el tap dispare el click del botón.
    if (delta > 4) event.preventDefault();
  }

  onPanelSheetTouchEnd(event: TouchEvent): void {
    const panel = this.getPanelEl(event.currentTarget);
    if (panel) {
      panel.classList.remove('is-dragging');
      panel.style.transform = '';
    }
    const delta = this.sheetDragLastDelta;
    this.sheetDragStartY = null;
    this.sheetDragLastDelta = 0;
    // Threshold de cierre: 90px. Si el usuario soltó antes, el panel
    // vuelve solo (por la transición CSS).
    if (delta > 90) {
      this.playlistPanelOpen.set(false);
      // Evita que el click-sintético tras el touchend reabra/toggle el panel.
      event.preventDefault();
    }
  }

  /** Reordenar un item del borrador (drag-and-drop). */
  onDraftReorder(event: CdkDragDrop<PlaylistDraftItem[]>): void {
    const draft = this.currentPlaylistDraft();
    if (!draft) return;
    const items = [...draft.items];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const renumbered = items.map((it, idx) => ({ ...it, position: idx + 1 }));
    this.manualDraftOverride.set({ ...draft, items: renumbered });
  }

  /** Elimina un libro del borrador (solo localmente; no toca la IA). */
  removeDraftItem(catalogBookId: number): void {
    const draft = this.currentPlaylistDraft();
    if (!draft) return;
    const filtered = draft.items
      .filter((it) => it.catalogBookId !== catalogBookId)
      .map((it, idx) => ({ ...it, position: idx + 1 }));
    this.manualDraftOverride.set({ ...draft, items: filtered });
  }

  /**
   * Guarda el borrador actual como playlist real en el backend.
   * Reutiliza `playlistService.create` (source='AI') con los items ordenados.
   */
  async saveDraftAsPlaylist(): Promise<void> {
    const draft = this.currentPlaylistDraft();
    if (!draft || draft.items.length === 0 || this.savingFinalPlaylist()) return;

    this.savingFinalPlaylist.set(true);
    const itemIds = draft.items.map((it) => it.catalogBookId);
    const lastUserMessage = [...this.messages()].filter((m) => m.role === 'user').pop();
    const aiPrompt = lastUserMessage?.content ?? null;

    try {
      const playlist = await firstValueFrom(
        this.playlistService.create({
          title: draft.title || 'Playlist creada en el chat',
          description: draft.description || (aiPrompt ? `Generada en el chat: "${aiPrompt.slice(0, 140)}"` : null),
          visibility: 'PRIVATE',
          source: 'AI',
          aiPrompt,
          itemIds,
        }),
      );
      this.showSavedPlaylistToast(playlist.id, playlist.title);
      // Una vez guardada, cerramos el panel y salimos del modo playlist:
      // el usuario normalmente querrá seguir con otra cosa.
      this.playlistPanelOpen.set(false);
      this.manualDraftOverride.set(null);
    } catch (err) {
      console.error('[ai-chat] error guardando playlist del borrador', err);
      window.alert('No se ha podido guardar la playlist.');
    } finally {
      this.savingFinalPlaylist.set(false);
    }
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

    // En modo playlist enviamos también el borrador actual (con las ediciones
    // manuales del usuario: reorder, delete) para que la IA ITERE sobre él
    // en vez de crear otra playlist desde cero. La primera vez no existe aún
    // y se envía undefined → la IA crea el borrador inicial.
    const options = this.playlistMode()
      ? {
          mode: 'playlist_builder' as const,
          maxItems: this.preferredMaxItems(),
          currentDraft: this.currentPlaylistDraft() ?? undefined,
        }
      : { mode: 'chat' as const };

    this.conversationService.sendMessage(userId, conversationId, content, options).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Si el usuario ha eliminado libros del borrador manualmente, pedimos a la
   * IA que se ajuste a ese tamaño (mínimo 3, máximo 20). Si no, 8 por defecto.
   */
  private preferredMaxItems(): number {
    const override = this.manualDraftOverride();
    if (override && override.items.length > 0) {
      return Math.max(3, Math.min(20, override.items.length));
    }
    return 8;
  }

  /** Alterna la visibilidad del sidebar en móvil. */
  toggleSidebarMobile() {
    this.showSidebarMobile.update(value => !value);
  }

  /**
   * Alterna el sidebar según breakpoint:
   * - móvil (<768px): abre/cierra el drawer overlay
   * - desktop: colapsa/expande la columna (y lo persiste)
   */
  toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.toggleSidebarMobile();
    } else {
      this.sidebarCollapsedDesktop.update((v) => {
        const next = !v;
        try {
          localStorage.setItem('bm_chat_sidebar_collapsed', next ? '1' : '0');
        } catch {}
        return next;
      });
    }
  }

  private readSidebarPreference(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('bm_chat_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  }

  /**
   * Alterna la grabación de voz (Web Speech API).
   * El texto dictado se va añadiendo al `currentMessage` conforme llega.
   */
  toggleVoiceInput() {
    if (!this.voiceInputSupported) return;
    if (this.isRecording()) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  private startVoiceInput() {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    try {
      const recognition = new SR();
      recognition.lang = this.resolveSpeechLang();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const baseText = this.currentMessage();
      let finalChunk = '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalChunk += res[0].transcript;
          else interim += res[0].transcript;
        }
        const composed = (baseText ? baseText + ' ' : '') + finalChunk + interim;
        this.currentMessage.set(composed.trimStart());
        queueMicrotask(() => this.autoResizeTextarea());
      };
      recognition.onerror = () => this.stopVoiceInput();
      recognition.onend = () => {
        this.isRecording.set(false);
        this.recognition = null;
      };

      this.recognition = recognition;
      this.isRecording.set(true);
      recognition.start();
    } catch {
      this.isRecording.set(false);
      this.recognition = null;
    }
  }

  private stopVoiceInput() {
    try {
      this.recognition?.stop();
    } catch {}
    this.isRecording.set(false);
    this.recognition = null;
  }

  /** Resuelve el idioma del dictado a partir de la traducción actual. */
  private resolveSpeechLang(): string {
    const lang = (this.translate.currentLang || this.translate.getDefaultLang() || 'es').toLowerCase();
    if (lang.startsWith('es')) return 'es-ES';
    if (lang.startsWith('en')) return 'en-US';
    return lang;
  }

  /**
   * Vuelve a la pantalla anterior (history.back) o, como fallback,
   * navega al home. Reemplaza al header global cuando estamos en
   * la pantalla de chat.
   */
  goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/home']);
    }
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

  /**
   * Resuelve una clave i18n y rellena el input con el texto traducido.
   * Evita usar el pipe `translate` dentro de expresiones `(click)`, donde
   * los pipes no están permitidos por el parser de Angular.
   */
  useSuggestionKey(key: string) {
    const text = this.translate.instant(key);
    this.useSuggestion(typeof text === 'string' ? text : key);
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
