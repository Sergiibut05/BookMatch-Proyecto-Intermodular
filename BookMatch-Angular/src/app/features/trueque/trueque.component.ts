import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import {
  TruequeService,
  type CreateUserBookDto,
  type PurchasedCatalogRow,
  type TradeDetail,
  type TradeDetailItem,
  type TradeListItem,
  type TradeParticipantPublic,
  type TradeStatus,
  type UserBookDetail,
  type UserBookListItem,
  type UserBooksListResponse,
} from '@core/services/trueque.service';
import { AuthService } from '@core/services/auth.service';
import { UsersService } from '@core/services/users.service';
import { forkJoin, EMPTY, Subject, Subscription } from 'rxjs';
import { debounceTime, finalize, switchMap } from 'rxjs/operators';

type TruequeTab = 'explore' | 'trades' | 'library';
type TradeAction = 'accept' | 'reject' | 'cancel' | 'complete';
type AddBookMode = 'manual' | 'purchases';

type ManualBookCondition = NonNullable<CreateUserBookDto['condition']>;

/** Dígitos para wa.me: prefijo 34 si es móvil español de 9 cifras. */
function normalizeWhatsappDigits(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9 && !d.startsWith('34')) d = `34${d}`;
  return d;
}

@Component({
  selector: 'app-trueque',
  imports: [CommonModule, Header, Footer, TranslateModule, PhoneInputComponent],
  templateUrl: './trueque.component.html',
  styleUrl: './trueque.component.scss',
})
export class TruequeComponent implements OnDestroy {
  private truequeService = inject(TruequeService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private translate = inject(TranslateService);
  private toastDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private demoTradesRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tradeDetailPollInterval: ReturnType<typeof setInterval> | null = null;
  private readonly exploreSearchPulse = new Subject<void>();
  private exploreSearchSub?: Subscription;
  private createDataSub?: Subscription;

  readonly PLACEHOLDER_COVER = 'assets/book-covers/book1.jpg';

  activeTab = signal<TruequeTab>('explore');
  query = signal('');

  readonly tabSegmentIndex = computed(() => {
    const tab = this.activeTab();
    if (tab === 'explore') return 0;
    if (tab === 'trades') return 1;
    return 2;
  });

  readonly exploreSkeletonSlots = [0, 1, 2, 3, 4, 5] as const;
  readonly tradeSkeletonSlots = [0, 1, 2] as const;
  readonly librarySkeletonSlots = [0, 1, 2, 3] as const;

  myUserId = computed(() => this.authService.currentUser()?.id ?? null);

  exploreItems = signal<UserBookListItem[]>([]);
  exploreTotal = signal(0);
  explorePage = signal(1);
  exploreTotalPages = signal(0);
  exploreLoading = signal(false);
  exploreError = signal<string | null>(null);

  tradesList = signal<TradeListItem[]>([]);
  tradesLoading = signal(false);
  tradesError = signal<string | null>(null);

  libraryItems = signal<UserBookListItem[]>([]);
  libraryLoading = signal(false);
  libraryError = signal<string | null>(null);

  selectedTradeId = signal<number | null>(null);
  tradeDetailLoading = signal(false);
  tradeDetail = signal<TradeDetail | null>(null);
  tradeDetailError = signal<string | null>(null);

  exploreBookModalOpen = signal(false);
  exploreBookDetail = signal<UserBookDetail | null>(null);
  exploreBookLoading = signal(false);
  exploreBookError = signal<string | null>(null);

  createOpen = signal(false);
  createLoading = signal(false);
  createReceiverId = signal<number | null>(null);
  createReceiverDisplayName = signal<string | null>(null);
  createOffered = signal<Set<number>>(new Set());
  createRequested = signal<Set<number>>(new Set());
  createReceiverBooks = signal<UserBookListItem[]>([]);
  createMyBooks = signal<UserBookListItem[]>([]);
  createContextLoading = signal(false);

  addBookOpen = signal(false);
  /** true: abierto desde «Nuevo trueque» (hero); textos orientados a publicar para Explorar. */
  addBookOfferFlow = signal(false);
  addBookMode = signal<AddBookMode>('manual');
  addBookLoading = signal(false);
  addBookTitle = signal('');
  addBookAuthor = signal('');
  addBookIsbn = signal('');
  addBookDescription = signal('');
  addBookCoverUrl = signal('');
  addBookCondition = signal<ManualBookCondition>('GOOD');
  purchaseSelected = signal<Set<number>>(new Set());
  purchasesRows = signal<PurchasedCatalogRow[]>([]);
  purchasesLoading = signal(false);

  toast = signal<string | null>(null);

  phoneModalOpen = signal(false);
  phoneInput = signal('');
  phoneSaving = signal(false);
  /** Clave i18n del error inline en el modal de teléfono. */
  phoneError = signal<string | null>(null);

  readonly truequeContentLocked = computed(() => this.phoneModalOpen());

  ngOnDestroy(): void {
    if (this.toastDismissTimer != null) {
      clearTimeout(this.toastDismissTimer);
      this.toastDismissTimer = null;
    }
    if (this.demoTradesRefreshTimer != null) {
      clearTimeout(this.demoTradesRefreshTimer);
      this.demoTradesRefreshTimer = null;
    }
    this.clearTradeDetailPoll();
    this.exploreSearchSub?.unsubscribe();
    this.createDataSub?.unsubscribe();
  }

  /** Tras crear propuesta a usuario seed, el backend puede auto-aceptar ~5 s después. */
  private scheduleTradesRefreshAfterDemoAccept(): void {
    if (this.demoTradesRefreshTimer != null) {
      clearTimeout(this.demoTradesRefreshTimer);
    }
    this.demoTradesRefreshTimer = setTimeout(() => {
      this.demoTradesRefreshTimer = null;
      this.loadTrades();
      const openId = this.selectedTradeId();
      if (openId != null) this.reloadTradeDetail();
    }, 5500);
  }

  private clearTradeDetailPoll(): void {
    if (this.tradeDetailPollInterval != null) {
      clearInterval(this.tradeDetailPollInterval);
      this.tradeDetailPollInterval = null;
    }
  }

  /** Refresca el detalle mientras esperamos la auto-aceptación demo (emisor + PROPOSED). */
  private startTradeDetailPollIfNeeded(trade: TradeDetail): void {
    this.clearTradeDetailPoll();
    const me = this.myUserId();
    if (trade.status !== 'PROPOSED' || trade.senderId !== me) return;

    let polls = 0;
    const maxPolls = 8;
    this.tradeDetailPollInterval = setInterval(() => {
      polls += 1;
      const openId = this.selectedTradeId();
      if (openId !== trade.id || polls > maxPolls) {
        this.clearTradeDetailPoll();
        return;
      }
      this.truequeService.getById(trade.id).subscribe({
        next: (updated) => {
          this.tradeDetail.set(updated);
          if (updated.status !== 'PROPOSED') {
            this.loadTrades();
            this.clearTradeDetailPoll();
          }
        },
      });
    }, 2000);
  }

  /** Muestra un mensaje i18n y lo oculta solo tras unos segundos. */
  private showToast(messageKey: string, durationMs = 4000): void {
    if (this.toastDismissTimer != null) {
      clearTimeout(this.toastDismissTimer);
      this.toastDismissTimer = null;
    }
    this.toast.set(messageKey);
    this.toastDismissTimer = setTimeout(() => {
      this.toast.set(null);
      this.toastDismissTimer = null;
    }, durationMs);
  }

  filteredLibrary = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.libraryItems();
    if (!q) return items;
    return items.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(q));
  });

  filteredTrades = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.tradesList();
    if (!q) return items;
    return items.filter(
      (t) =>
        String(t.id).includes(q) ||
        t.status.toLowerCase().includes(q) ||
        String(t.senderId).includes(q) ||
        String(t.receiverId).includes(q),
    );
  });

  mySideItems = computed(() => {
    const t = this.tradeDetail();
    const me = this.myUserId();
    if (!t || me == null) return [] as TradeDetailItem[];
    const side: 'SENDER' | 'RECEIVER' = t.senderId === me ? 'SENDER' : 'RECEIVER';
    return t.items.filter((i) => i.side === side);
  });

  otherSideItems = computed(() => {
    const t = this.tradeDetail();
    const me = this.myUserId();
    if (!t || me == null) return [] as TradeDetailItem[];
    const side: 'SENDER' | 'RECEIVER' = t.senderId === me ? 'RECEIVER' : 'SENDER';
    return t.items.filter((i) => i.side === side);
  });

  /** Contrincante con email/teléfono cuando el trueque está aceptado o completado. */
  tradeCounterparty = computed((): TradeParticipantPublic | null => {
    const t = this.tradeDetail();
    const me = this.myUserId();
    if (!t || me == null) return null;
    if (t.status !== 'ACCEPTED' && t.status !== 'COMPLETED') return null;
    const mine = t.senderId === me;
    return mine ? (t.receiver ?? null) : (t.sender ?? null);
  });

  otherPartyName = computed(() => {
    const t = this.tradeDetail();
    const me = this.myUserId();
    if (!t || me == null) return '';
    const cp = this.tradeCounterparty();
    if (cp?.fullName?.trim()) return cp.fullName.trim();
    const otherId = t.senderId === me ? t.receiverId : t.senderId;
    const hit = t.items.find((i) => i.userBook.owner.id === otherId);
    return hit?.userBook.owner.fullName?.trim() || `Usuario #${otherId}`;
  });

  counterpartyWhatsappHref = computed((): string | null => {
    const cp = this.tradeCounterparty();
    const t = this.tradeDetail();
    if (!cp?.phone?.trim() || !t) return null;
    const digits = normalizeWhatsappDigits(cp.phone);
    if (!digits) return null;
    const text = this.translate.instant('TRUEQUE.WHATSAPP_PREFILL', { id: String(t.id) });
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  });

  counterpartyAvatarSrc = computed((): string => {
    const cp = this.tradeCounterparty();
    const url = cp?.avatarUrl?.trim();
    return url || this.PLACEHOLDER_COVER;
  });

  availableActions = computed<TradeAction[]>(() => {
    const t = this.tradeDetail();
    const me = this.myUserId();
    if (!t || me == null) return [];

    if (t.status === 'PROPOSED') {
      return t.senderId === me ? ['cancel'] : ['reject', 'accept'];
    }
    if (t.status === 'ACCEPTED') {
      return ['complete'];
    }
    return [];
  });

  offeredOptions = computed(() =>
    this.createMyBooks().map((b) => ({ id: b.id, book: this.toBookCard(b) })),
  );

  requestedOptions = computed(() =>
    this.createReceiverBooks().map((b) => ({ id: b.id, book: this.toBookCard(b) })),
  );

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.phoneModalOpen.set(false);
        return;
      }
      if (this.phoneSaving()) return;
      this.phoneModalOpen.set(!user.phone?.trim());
    });

    this.loadExplore();
    this.exploreSearchSub = this.exploreSearchPulse
      .pipe(
        debounceTime(400),
        switchMap(() => {
          if (this.activeTab() !== 'explore') {
            return EMPTY;
          }
          this.explorePage.set(1);
          this.exploreLoading.set(true);
          this.exploreError.set(null);
          return this.runExploreListRequest().pipe(finalize(() => this.exploreLoading.set(false)));
        }),
      )
      .subscribe({
        next: (res) => this.applyExploreResponse(res),
        error: () => {
          this.exploreError.set('TRUEQUE.ERROR_EXPLORE');
        },
      });
  }

  coverSrc(ub: { coverUrl: string | null; imageUrls?: string[] | null }): string {
    if (ub.coverUrl?.trim()) return ub.coverUrl;
    const u = ub.imageUrls?.find((x) => x?.trim());
    return u ?? this.PLACEHOLDER_COVER;
  }

  toBookCard(ub: UserBookListItem) {
    return {
      id: String(ub.id),
      title: ub.title,
      author: ub.author,
      coverUrl: this.coverSrc(ub),
    };
  }

  setTab(tab: TruequeTab) {
    this.activeTab.set(tab);
    this.query.set('');
    this.closeTrade();
    this.closeExploreBook();
    if (tab === 'explore') {
      this.explorePage.set(1);
      this.loadExplore();
    } else if (tab === 'trades') {
      this.loadTrades();
    } else {
      this.loadLibrary();
    }
  }

  onSearchInput(value: string) {
    this.query.set(value);
    if (this.activeTab() === 'explore') {
      this.exploreSearchPulse.next();
    }
  }

  clearSearchQuery() {
    this.query.set('');
    if (this.activeTab() === 'explore') {
      this.exploreSearchPulse.next();
    }
  }

  private runExploreListRequest() {
    return this.truequeService.listAvailable({
      page: this.explorePage(),
      limit: 20,
      search: this.query().trim() || undefined,
    });
  }

  private applyExploreResponse(res: UserBooksListResponse): void {
    const uid = this.myUserId();
    const items = uid != null ? res.items.filter((b) => b.ownerId !== uid) : res.items;
    this.exploreItems.set(items);
    this.exploreTotal.set(res.total);
    this.exploreTotalPages.set(res.totalPages);
  }

  loadExplore() {
    this.exploreLoading.set(true);
    this.exploreError.set(null);
    this.runExploreListRequest()
      .pipe(finalize(() => this.exploreLoading.set(false)))
      .subscribe({
        next: (res) => this.applyExploreResponse(res),
        error: () => {
          this.exploreError.set('TRUEQUE.ERROR_EXPLORE');
        },
      });
  }

  explorePrevPage() {
    if (this.explorePage() <= 1) return;
    this.explorePage.update((p) => p - 1);
    this.loadExplore();
  }

  exploreNextPage() {
    if (this.explorePage() >= this.exploreTotalPages()) return;
    this.explorePage.update((p) => p + 1);
    this.loadExplore();
  }

  loadTrades() {
    if (this.myUserId() == null) {
      this.tradesList.set([]);
      return;
    }
    this.tradesLoading.set(true);
    this.tradesError.set(null);
    this.truequeService.listMine().subscribe({
      next: (items) => {
        this.tradesList.set(items);
        this.tradesLoading.set(false);
      },
      error: () => {
        this.tradesLoading.set(false);
        this.tradesError.set('TRUEQUE.ERROR_TRADES');
      },
    });
  }

  loadLibrary() {
    if (this.myUserId() == null) {
      this.libraryItems.set([]);
      return;
    }
    this.libraryLoading.set(true);
    this.libraryError.set(null);
    this.truequeService.getMyBooks().subscribe({
      next: (items) => {
        this.libraryItems.set(items);
        this.libraryLoading.set(false);
      },
      error: () => {
        this.libraryLoading.set(false);
        this.libraryError.set('TRUEQUE.ERROR_LIBRARY');
      },
    });
  }

  openExploreDetail(id: number) {
    this.exploreBookModalOpen.set(true);
    this.exploreBookLoading.set(true);
    this.exploreBookDetail.set(null);
    this.exploreBookError.set(null);
    this.truequeService.getUserBookById(id).subscribe({
      next: (b) => {
        this.exploreBookDetail.set(b);
        this.exploreBookLoading.set(false);
      },
      error: () => {
        this.exploreBookLoading.set(false);
        this.exploreBookError.set('TRUEQUE.ERROR_BOOK_DETAIL');
      },
    });
  }

  closeExploreBook() {
    this.exploreBookModalOpen.set(false);
    this.exploreBookDetail.set(null);
  }

  onExploreBookBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeExploreBook();
    }
  }

  /** Portada preferente: `coverUrl` del API si existe; si no, primera `imageUrls` o placeholder. */
  coverPrimary(ub: Pick<UserBookListItem, 'coverUrl' | 'imageUrls'>): string {
    if (ub.coverUrl?.trim()) return ub.coverUrl.trim();
    return this.coverSrc(ub);
  }

  proposeFromExplore() {
    const b = this.exploreBookDetail();
    if (!b || this.myUserId() == null) return;
    if (b.ownerId === this.myUserId()) return;
    this.closeExploreBook();
    this.openCreateForReceiver(b.ownerId, b.owner.fullName);
  }

  openCreateForReceiver(receiverId: number, receiverDisplayName?: string | null) {
    if (this.myUserId() == null) {
      this.showToast('TRUEQUE.LOGIN_REQUIRED');
      return;
    }
    this.createReceiverId.set(receiverId);
    this.createReceiverDisplayName.set(receiverDisplayName?.trim() || null);
    this.createOffered.set(new Set());
    this.createRequested.set(new Set());
    this.createOpen.set(true);
    this.createContextLoading.set(true);
    this.createDataSub?.unsubscribe();
    this.createDataSub = forkJoin({
      mine: this.truequeService.getMyBooks(),
      theirs: this.truequeService.listAvailable({ ownerId: receiverId, limit: 50 }),
    }).subscribe({
      next: ({ mine, theirs }) => {
        this.createMyBooks.set(mine);
        const uid = this.myUserId();
        const list =
          uid != null ? theirs.items.filter((x) => x.ownerId === receiverId) : theirs.items;
        this.createReceiverBooks.set(list);
        this.createContextLoading.set(false);
      },
      error: () => {
        this.createMyBooks.set([]);
        this.createReceiverBooks.set([]);
        this.createContextLoading.set(false);
        this.showToast('TRUEQUE.ERROR_CREATE_CONTEXT');
      },
    });
  }

  openCreate() {
    if (this.myUserId() == null) {
      this.showToast('TRUEQUE.LOGIN_REQUIRED');
      this.setTab('explore');
      return;
    }
    this.setTab('explore');
    this.openAddBook({ offerFlow: true });
  }

  onCreateBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCreate();
    }
  }

  closeCreate() {
    this.createDataSub?.unsubscribe();
    this.createDataSub = undefined;
    this.createOpen.set(false);
    this.createLoading.set(false);
    this.createReceiverId.set(null);
    this.createReceiverDisplayName.set(null);
  }

  setOfferedSelection(id: number, checked: boolean) {
    this.createOffered.update((s) => {
      const next = new Set(s);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  setRequestedSelection(id: number, checked: boolean) {
    this.createRequested.update((s) => {
      const next = new Set(s);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  submitCreate() {
    const receiverUserId = this.createReceiverId();
    if (receiverUserId == null) {
      this.showToast('TRUEQUE.CREATE_NEED_RECEIVER');
      return;
    }
    const offeredUserBookIds = Array.from(this.createOffered());
    const requestedUserBookIds = Array.from(this.createRequested());
    if (!offeredUserBookIds.length) {
      this.showToast('TRUEQUE.CREATE_NEED_OFFER');
      return;
    }

    this.createLoading.set(true);
    this.truequeService
      .create({ receiverUserId, offeredUserBookIds, requestedUserBookIds })
      .subscribe({
        next: () => {
          this.createLoading.set(false);
          this.closeCreate();
          this.showToast('TRUEQUE.CREATE_OK');
          this.setTab('trades');
          this.loadTrades();
          this.scheduleTradesRefreshAfterDemoAccept();
        },
        error: () => {
          this.createLoading.set(false);
          this.showToast('TRUEQUE.CREATE_FAIL');
        },
      });
  }

  openTrade(id: number) {
    this.selectedTradeId.set(id);
    this.tradeDetailLoading.set(true);
    this.tradeDetail.set(null);
    this.tradeDetailError.set(null);
    this.truequeService.getById(id).subscribe({
      next: (t) => {
        this.tradeDetail.set(t);
        this.tradeDetailLoading.set(false);
        this.startTradeDetailPollIfNeeded(t);
      },
      error: () => {
        this.tradeDetailLoading.set(false);
        this.tradeDetailError.set('TRUEQUE.ERROR_TRADE_DETAIL');
      },
    });
  }

  closeTrade() {
    this.clearTradeDetailPoll();
    this.selectedTradeId.set(null);
    this.tradeDetail.set(null);
    this.tradeDetailError.set(null);
  }

  reloadTradeDetail() {
    const id = this.selectedTradeId();
    if (id != null) this.openTrade(id);
  }

  acceptSelectedTrade() {
    const id = this.selectedTradeId();
    if (id == null) return;
    this.truequeService.accept(id).subscribe({
      next: (t) => this.tradeDetail.set(t),
      error: () => this.tradeDetailError.set('TRUEQUE.ERROR_ACCEPT'),
    });
  }

  rejectSelectedTrade() {
    const id = this.selectedTradeId();
    if (id == null) return;
    this.truequeService.reject(id).subscribe({
      next: (t) => this.tradeDetail.set(t),
      error: () => this.tradeDetailError.set('TRUEQUE.ERROR_REJECT'),
    });
  }

  cancelSelectedTrade() {
    const id = this.selectedTradeId();
    if (id == null) return;
    this.truequeService.cancel(id).subscribe({
      next: () => {
        this.closeTrade();
        this.loadTrades();
      },
      error: () => this.tradeDetailError.set('TRUEQUE.ERROR_CANCEL'),
    });
  }

  completeSelectedTrade() {
    const id = this.selectedTradeId();
    if (id == null) return;
    this.truequeService.complete(id).subscribe({
      next: (t) => {
        this.tradeDetail.set(t);
        this.loadLibrary();
        this.loadExplore();
        this.loadTrades();
      },
      error: () => this.tradeDetailError.set('TRUEQUE.ERROR_COMPLETE'),
    });
  }

  openAddBook(options?: { offerFlow?: boolean }) {
    if (this.myUserId() == null) {
      this.showToast('TRUEQUE.LOGIN_REQUIRED');
      return;
    }
    this.addBookOfferFlow.set(!!options?.offerFlow);
    this.resetAddBookForm();
    this.addBookMode.set('manual');
    this.addBookOpen.set(true);
  }

  private resetAddBookForm() {
    this.addBookTitle.set('');
    this.addBookAuthor.set('');
    this.addBookIsbn.set('');
    this.addBookDescription.set('');
    this.addBookCoverUrl.set('');
    this.addBookCondition.set('GOOD');
    this.purchaseSelected.set(new Set());
    this.purchasesRows.set([]);
  }

  closeAddBook() {
    this.addBookOpen.set(false);
    this.addBookLoading.set(false);
    this.addBookOfferFlow.set(false);
    this.resetAddBookForm();
  }

  onAddBookBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeAddBook();
    }
  }

  setAddBookMode(mode: AddBookMode) {
    this.addBookMode.set(mode);
    this.purchaseSelected.set(new Set());
    if (mode === 'purchases') {
      this.purchasesLoading.set(true);
      this.truequeService.getFromPurchases().subscribe({
        next: (rows) => {
          this.purchasesRows.set(rows);
          this.purchasesLoading.set(false);
        },
        error: () => {
          this.purchasesRows.set([]);
          this.purchasesLoading.set(false);
        },
      });
    }
  }

  onAddBookConditionChange(value: string) {
    const v = value as ManualBookCondition;
    if (['NEW', 'LIKE_NEW', 'GOOD', 'ACCEPTABLE', 'WORN'].includes(v)) {
      this.addBookCondition.set(v);
    }
  }

  setPurchaseSelection(catalogBookId: number, checked: boolean) {
    this.purchaseSelected.update((s) => {
      const next = new Set(s);
      if (checked) next.add(catalogBookId);
      else next.delete(catalogBookId);
      return next;
    });
  }

  submitManualBook() {
    const title = this.addBookTitle().trim();
    const author = this.addBookAuthor().trim();
    if (!title || !author) {
      this.showToast('TRUEQUE.ADD_MANUAL_INVALID');
      return;
    }
    const dto: CreateUserBookDto = {
      title,
      author,
      isbn: this.addBookIsbn().trim() || null,
      description: this.addBookDescription().trim() || null,
      coverUrl: this.addBookCoverUrl().trim() || null,
      condition: this.addBookCondition(),
    };
    this.addBookLoading.set(true);
    this.truequeService.createUserBook(dto).subscribe({
      next: () => {
        const fromOffer = this.addBookOfferFlow();
        this.addBookLoading.set(false);
        this.closeAddBook();
        this.showToast(fromOffer ? 'TRUEQUE.OFFER_ADD_OK' : 'TRUEQUE.ADD_OK');
        this.loadLibrary();
        this.loadExplore();
      },
      error: () => {
        this.addBookLoading.set(false);
        this.showToast('TRUEQUE.ADD_FAIL');
      },
    });
  }

  submitSelectedPurchases() {
    const ids = [...this.purchaseSelected()];
    if (!ids.length) {
      this.showToast('TRUEQUE.ADD_SELECT_PURCHASES');
      return;
    }
    this.addBookLoading.set(true);
    forkJoin(ids.map((cid) => this.truequeService.createUserBook({ catalogBookId: cid }))).subscribe({
      next: () => {
        const fromOffer = this.addBookOfferFlow();
        this.addBookLoading.set(false);
        this.closeAddBook();
        this.showToast(
          fromOffer
            ? ids.length > 1
              ? 'TRUEQUE.OFFER_ADD_OK_BULK'
              : 'TRUEQUE.OFFER_ADD_OK'
            : ids.length > 1
              ? 'TRUEQUE.ADD_OK_BULK'
              : 'TRUEQUE.ADD_OK',
        );
        this.loadLibrary();
        this.loadExplore();
      },
      error: () => {
        this.addBookLoading.set(false);
        this.showToast('TRUEQUE.ADD_FAIL');
      },
    });
  }

  deleteLibraryBook(id: number) {
    const msg = this.translate.instant('TRUEQUE.DELETE_LIBRARY_CONFIRM');
    if (!confirm(msg)) return;
    this.truequeService.deleteUserBook(id).subscribe({
      next: () => {
        this.showToast('TRUEQUE.DELETE_OK');
        this.loadLibrary();
        this.loadExplore();
      },
      error: () => this.showToast('TRUEQUE.DELETE_FAIL'),
    });
  }

  isSenderTrade(t: TradeListItem): boolean {
    const me = this.myUserId();
    return me != null && t.senderId === me;
  }

  tradePreviewCovers(trade: TradeListItem): (string | null)[] {
    return trade.previewCovers ?? [];
  }

  tradeStatusLabelKey(status: TradeStatus): string {
    const keys: Record<TradeStatus, string> = {
      PROPOSED: 'TRUEQUE.STATUS_PROPOSED',
      ACCEPTED: 'TRUEQUE.STATUS_ACCEPTED',
      REJECTED: 'TRUEQUE.STATUS_REJECTED',
      CANCELLED: 'TRUEQUE.STATUS_CANCELLED',
      COMPLETED: 'TRUEQUE.STATUS_COMPLETED',
      EXPIRED: 'TRUEQUE.STATUS_EXPIRED',
    };
    return keys[status] ?? 'TRUEQUE.STATUS_PROPOSED';
  }

  tradeStatusBadgeClass(status: TradeStatus): string {
    const map: Record<TradeStatus, string> = {
      PROPOSED: 'tq-badge tq-badge--proposed',
      ACCEPTED: 'tq-badge tq-badge--accepted',
      REJECTED: 'tq-badge tq-badge--rejected',
      CANCELLED: 'tq-badge tq-badge--cancelled',
      COMPLETED: 'tq-badge tq-badge--completed',
      EXPIRED: 'tq-badge tq-badge--expired',
    };
    return map[status] ?? 'tq-badge';
  }

  tradeCardAriaLabel(t: TradeListItem): string {
    const status = this.translate.instant(this.tradeStatusLabelKey(t.status));
    return this.translate.instant('TRUEQUE.TRADE_CARD_ARIA', { id: t.id, status });
  }

  onTradeBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeTrade();
    }
  }

  onPhoneChange(value: string): void {
    this.phoneInput.set(value);
    if (this.phoneError()) {
      this.phoneError.set(null);
    }
  }

  savePhone(): void {
    const raw = this.phoneInput().trim();
    const digits = raw.replace(/\D/g, '');
    if (!raw || digits.length < 6) {
      this.phoneError.set('PROFILE.ERROR_PHONE_MIN');
      return;
    }

    this.phoneSaving.set(true);
    this.phoneError.set(null);

    this.usersService.updateMyProfile({ phone: raw }).subscribe({
      next: (profile) => {
        this.authService.mergeCurrentUser({ phone: profile.phone ?? raw });
        this.phoneSaving.set(false);
        this.phoneModalOpen.set(false);
        this.phoneInput.set('');
      },
      error: () => {
        this.phoneSaving.set(false);
        this.phoneError.set('TRUEQUE.PHONE_MODAL_ERROR');
      },
    });
  }
}
