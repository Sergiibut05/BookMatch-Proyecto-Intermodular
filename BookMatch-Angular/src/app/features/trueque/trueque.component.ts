import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';
import { TranslateModule } from '@ngx-translate/core';
import { TruequeService } from '@core/services/trueque.service';

type TruequeTab = 'news' | 'popular' | 'mine';

type TruequeUserLite = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type TruequeBookLite = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
};

type TruequeCard = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
};

type TradeStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
type TradeAction = 'accept' | 'reject' | 'cancel' | 'complete';

type TruequeTrade = {
  id: string;
  status: TradeStatus;
  updatedAt: string;
  me: TruequeUserLite;
  other: TruequeUserLite;
  senderCount: number;
  receiverCount: number;
  previewCovers: string[];
  isSender: boolean;
  senderBooks: TruequeBookLite[];
  receiverBooks: TruequeBookLite[];
};

@Component({
  selector: 'app-trueque',
  imports: [CommonModule, Header, Footer, TranslateModule],
  templateUrl: './trueque.component.html',
  styleUrl: './trueque.component.scss',
})
export class TruequeComponent {
  private truequeService = inject(TruequeService);

  activeTab = signal<TruequeTab>('news');
  query = signal('');
  selectedTradeId = signal<string | null>(null);
  createOpen = signal(false);
  createLoading = signal(false);
  mineLoading = signal(false);
  mineError = signal<string | null>(null);
  toast = signal<string | null>(null);

  createReceiverId = signal<number>(2);
  createOffered = signal<Set<number>>(new Set([101]));
  createRequested = signal<Set<number>>(new Set([201]));

  private bookGrid: Record<'news' | 'popular', TruequeBookLite[]> = {
    news: [
      { id: 'ast-1', title: 'Astérix en Lusitania', author: 'Goscinny, René', coverUrl: 'assets/book-covers/book1.jpg' },
      { id: 'tata-2', title: 'Tatá', author: 'Perrin, Valérie', coverUrl: 'assets/book-covers/book2.jpg' },
      { id: 'asi-3', title: 'La Asistenta', author: 'Mcfadden, Freida', coverUrl: 'assets/book-covers/book3.jpg' },
      { id: 'paj-4', title: 'Los Pájaros', author: 'Vesaas, Tarjei', coverUrl: 'assets/book-covers/book4.jpg' },
      { id: 'op-5', title: 'One Piece Nº111', author: 'Oda, Eiichiro', coverUrl: 'assets/book-covers/book5.jpg' },
      { id: 'fra-6', title: 'Francofacts', author: 'Sánchez, Fernando', coverUrl: 'assets/book-covers/book6.jpg' },
    ],
    popular: [
      { id: 'near-1', title: 'El Nombre del Viento', author: 'Rothfuss, Patrick', coverUrl: 'assets/book-covers/book7.jpg' },
      { id: 'near-2', title: 'Dune', author: 'Herbert, Frank', coverUrl: 'assets/book-covers/book8.jpg' },
      { id: 'near-3', title: '1984', author: 'Orwell, George', coverUrl: 'assets/book-covers/book9.jpg' },
    ],
  };

  private myUser: TruequeUserLite = {
    id: 'me',
    name: 'Tú',
  };

  private devUsers: Array<{ id: number; name: string }> = [
    { id: 2, name: 'Ana' },
    { id: 3, name: 'David' },
    { id: 4, name: 'Lucía' },
  ];

  private myLibrary: Array<{ id: number; book: TruequeBookLite }> = [
    { id: 101, book: { id: 'm-101', title: 'Astérix en Lusitania', author: 'Goscinny, René', coverUrl: 'assets/book-covers/book1.jpg' } },
    { id: 102, book: { id: 'm-102', title: 'Tatá', author: 'Perrin, Valérie', coverUrl: 'assets/book-covers/book2.jpg' } },
    { id: 103, book: { id: 'm-103', title: 'Los Pájaros', author: 'Vesaas, Tarjei', coverUrl: 'assets/book-covers/book4.jpg' } },
  ];

  private otherLibrary: Record<number, Array<{ id: number; book: TruequeBookLite }>> = {
    2: [
      { id: 201, book: { id: 'o-201', title: 'La Asistenta', author: 'Mcfadden, Freida', coverUrl: 'assets/book-covers/book3.jpg' } },
      { id: 202, book: { id: 'o-202', title: 'One Piece Nº111', author: 'Oda, Eiichiro', coverUrl: 'assets/book-covers/book5.jpg' } },
    ],
    3: [
      { id: 301, book: { id: 'o-301', title: 'Dune', author: 'Herbert, Frank', coverUrl: 'assets/book-covers/book8.jpg' } },
      { id: 302, book: { id: 'o-302', title: '1984', author: 'Orwell, George', coverUrl: 'assets/book-covers/book9.jpg' } },
    ],
    4: [
      { id: 401, book: { id: 'o-401', title: 'El Nombre del Viento', author: 'Rothfuss, Patrick', coverUrl: 'assets/book-covers/book7.jpg' } },
    ],
  };

  receivers = computed(() => this.devUsers);
  offeredOptions = computed(() => this.myLibrary);
  requestedOptions = computed(() => this.otherLibrary[this.createReceiverId()] ?? []);

  private tradesMineSignal = signal<TruequeTrade[]>([
    {
      id: 'tr-1024',
      status: 'PROPOSED',
      updatedAt: 'Hace 2h',
      me: this.myUser,
      other: { id: 'u-ana', name: 'Ana' },
      senderCount: 2,
      receiverCount: 1,
      previewCovers: ['assets/book-covers/book1.jpg', 'assets/book-covers/book2.jpg', 'assets/book-covers/book3.jpg'],
      isSender: true,
      senderBooks: [
        { id: 'b1', title: 'Astérix en Lusitania', author: 'Goscinny, René', coverUrl: 'assets/book-covers/book1.jpg' },
        { id: 'b2', title: 'Tatá', author: 'Perrin, Valérie', coverUrl: 'assets/book-covers/book2.jpg' },
      ],
      receiverBooks: [{ id: 'b3', title: 'La Asistenta', author: 'Mcfadden, Freida', coverUrl: 'assets/book-covers/book3.jpg' }],
    },
    {
      id: 'tr-1025',
      status: 'ACCEPTED',
      updatedAt: 'Ayer',
      me: this.myUser,
      other: { id: 'u-david', name: 'David' },
      senderCount: 1,
      receiverCount: 2,
      previewCovers: ['assets/book-covers/book7.jpg', 'assets/book-covers/book8.jpg', 'assets/book-covers/book9.jpg'],
      isSender: false,
      senderBooks: [{ id: 'b7', title: 'El Nombre del Viento', author: 'Rothfuss, Patrick', coverUrl: 'assets/book-covers/book7.jpg' }],
      receiverBooks: [
        { id: 'b8', title: 'Dune', author: 'Herbert, Frank', coverUrl: 'assets/book-covers/book8.jpg' },
        { id: 'b9', title: '1984', author: 'Orwell, George', coverUrl: 'assets/book-covers/book9.jpg' },
      ],
    },
    {
      id: 'tr-1026',
      status: 'COMPLETED',
      updatedAt: 'Hace 1 semana',
      me: this.myUser,
      other: { id: 'u-lucia', name: 'Lucía' },
      senderCount: 1,
      receiverCount: 1,
      previewCovers: ['assets/book-covers/book4.jpg', 'assets/book-covers/book5.jpg'],
      isSender: true,
      senderBooks: [{ id: 'b4', title: 'Los Pájaros', author: 'Vesaas, Tarjei', coverUrl: 'assets/book-covers/book4.jpg' }],
      receiverBooks: [{ id: 'b5', title: 'One Piece Nº111', author: 'Oda, Eiichiro', coverUrl: 'assets/book-covers/book5.jpg' }],
    },
  ]);

  constructor() {
    // Si se aterriza directamente en /trueque, aseguramos carga en "Mis trueques"
    if (this.activeTab() === 'mine') {
      this.loadMineTrades();
    }
  }

  mySideBooks = computed(() => {
    const t = this.selectedTrade();
    if (!t) return [];
    return t.isSender ? t.senderBooks : t.receiverBooks;
  });

  otherSideBooks = computed(() => {
    const t = this.selectedTrade();
    if (!t) return [];
    return t.isSender ? t.receiverBooks : t.senderBooks;
  });

  books = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = this.activeTab();
    const cards = tab === 'news' ? this.bookGrid.news : this.bookGrid.popular;
    if (!q) return cards;
    return cards.filter(c => `${c.title} ${c.author}`.toLowerCase().includes(q));
  });

  myTrades = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.tradesMineSignal();
    if (!q) return items;
    return items.filter(t => `${t.id} ${t.other.name}`.toLowerCase().includes(q));
  });

  selectedTrade = computed(() => {
    const id = this.selectedTradeId();
    if (!id) return null;
    return this.tradesMineSignal().find(t => t.id === id) ?? null;
  });

  availableActions = computed<TradeAction[]>(() => {
    const t = this.selectedTrade();
    if (!t) return [];

    if (t.status === 'PROPOSED') {
      return t.isSender ? ['cancel'] : ['reject', 'accept'];
    }

    if (t.status === 'ACCEPTED') {
      return ['complete'];
    }

    return [];
  });

  setTab(tab: TruequeTab) {
    this.activeTab.set(tab);
    this.query.set('');
    this.selectedTradeId.set(null);
    if (tab === 'mine') this.loadMineTrades();
  }

  openCreate() {
    this.createOpen.set(true);
    this.toast.set(null);
  }

  onReceiverChange(value: unknown) {
    const id = Number(value);
    this.createReceiverId.set(Number.isFinite(id) ? id : 2);
    this.createRequested.set(new Set());
  }

  closeCreate() {
    this.createOpen.set(false);
    this.createLoading.set(false);
  }

  toggleOffered(id: number) {
    this.createOffered.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleRequested(id: number) {
    this.createRequested.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  submitCreate() {
    const receiverUserId = this.createReceiverId();
    const offeredUserBookIds = Array.from(this.createOffered());
    const requestedUserBookIds = Array.from(this.createRequested());
    if (!offeredUserBookIds.length) {
      this.toast.set('Elige al menos 1 libro para ofrecer.');
      return;
    }

    this.createLoading.set(true);
    this.truequeService
      .create({ receiverUserId, offeredUserBookIds, requestedUserBookIds })
      .subscribe({
        next: () => {
          this.createLoading.set(false);
          this.createOpen.set(false);
          this.toast.set('Propuesta enviada.');
          this.setTab('mine');
          this.loadMineTrades();
        },
        error: () => {
          this.createLoading.set(false);
          this.toast.set('No se ha podido crear el trueque.');
        },
      });
  }

  openTrade(id: string) {
    this.selectedTradeId.set(id);
  }

  closeTrade() {
    this.selectedTradeId.set(null);
  }

  acceptSelectedTrade() {
    const t = this.selectedTrade();
    if (!t) return;
    const id = Number(t.id.replace(/^tr-/, ''));
    this.truequeService.accept(id).subscribe({
      next: () => {
        t.status = 'ACCEPTED';
      },
      error: () => {
        this.mineError.set('No se ha podido aceptar el trueque.');
      },
    });
  }

  rejectSelectedTrade() {
    const t = this.selectedTrade();
    if (!t) return;
    const id = Number(t.id.replace(/^tr-/, ''));
    this.truequeService.reject(id).subscribe({
      next: () => {
        t.status = 'REJECTED';
      },
      error: () => {
        this.mineError.set('No se ha podido rechazar el trueque.');
      },
    });
  }

  cancelSelectedTrade() {
    const t = this.selectedTrade();
    if (!t) return;
    const id = Number(t.id.replace(/^tr-/, ''));
    this.truequeService.cancel(id).subscribe({
      next: () => {
        t.status = 'CANCELLED';
      },
      error: () => {
        this.mineError.set('No se ha podido cancelar el trueque.');
      },
    });
  }

  completeSelectedTrade() {
    const t = this.selectedTrade();
    if (!t) return;
    const id = Number(t.id.replace(/^tr-/, ''));
    this.truequeService.complete(id).subscribe({
      next: () => {
        t.status = 'COMPLETED';
      },
      error: () => {
        this.mineError.set('No se ha podido completar el trueque.');
      },
    });
  }

  private loadMineTrades() {
    this.mineLoading.set(true);
    this.mineError.set(null);
    this.truequeService.listMine().subscribe({
      next: (items) => {
        // UI-first: mapeo mínimo desde backend (in-memory) → cards.
        this.tradesMineSignal.set(
          items.map((it) => ({
            id: `tr-${it.id}`,
            status: it.status,
            updatedAt: 'Ahora',
            me: this.myUser,
            other: { id: String(it.senderId === 0 ? it.receiverId : it.senderId), name: 'Usuario' },
            senderCount: 1,
            receiverCount: 1,
            previewCovers: ['assets/book-covers/book1.jpg', 'assets/book-covers/book2.jpg'],
            isSender: true,
            senderBooks: [
              { id: 'b1', title: 'Libro A', author: 'Autor A', coverUrl: 'assets/book-covers/book1.jpg' },
            ],
            receiverBooks: [
              { id: 'b2', title: 'Libro B', author: 'Autor B', coverUrl: 'assets/book-covers/book2.jpg' },
            ],
          })),
        );
        this.mineLoading.set(false);
      },
      error: () => {
        this.mineLoading.set(false);
        this.mineError.set('No se han podido cargar tus trueques.');
      },
    });
  }
}

