import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { OrdersService } from './orders.service';
import type { Order } from '@shared/models/orders.model';

export type TradeStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';

export type UserBookOwnerLite = {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
};

export type UserBookCategory = { id: number; name: string; slug: string };

export type UserBookListItem = {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  coverUrl: string | null;
  imageUrls: string[];
  condition: string;
  catalogBookId: number | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  owner: UserBookOwnerLite;
  categories: UserBookCategory[];
};

export type UserBooksListResponse = {
  items: UserBookListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListAvailableQuery = {
  page?: number;
  limit?: number;
  search?: string;
  ownerId?: number;
  categoryId?: number;
  condition?: string;
};

export type UserBookOwnerDetail = UserBookOwnerLite & {
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type UserBookTradeItem = {
  id: number;
  tradeId: number;
  userBookId: number;
  side: 'SENDER' | 'RECEIVER';
  createdAt: string;
  trade: {
    id: number;
    status: TradeStatus;
    senderId: number;
    receiverId: number;
    createdAt: string;
  };
};

export type UserBookDetail = Omit<UserBookListItem, 'owner'> & {
  owner: UserBookOwnerDetail;
  tradeItems: UserBookTradeItem[];
};

export type UserBookDetailResponse = { book: UserBookDetail };

export type MyUserBooksResponse = { items: UserBookListItem[] };

export type TradeListItem = {
  id: number;
  status: TradeStatus;
  senderId: number;
  receiverId: number;
  createdAt: string;
  updatedAt: string;
  /** Portadas de muestra desde el API (listado). */
  previewCovers?: (string | null)[];
};

export type TradeDetailItem = {
  id: number;
  tradeId: number;
  userBookId: number;
  side: 'SENDER' | 'RECEIVER';
  createdAt: string;
  userBook: {
    id: number;
    title: string;
    author: string;
    coverUrl: string | null;
    imageUrls?: string[];
    owner: UserBookOwnerLite;
  };
};

/** Participante con datos de contacto; solo en trueques ACCEPTED / COMPLETED. */
export type TradeParticipantPublic = {
  id: number;
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
  phone: string | null;
};

export type TradeDetail = TradeListItem & {
  message: string | null;
  expiresAt: string | null;
  /** Solo en ACCEPTED / COMPLETED. */
  sender?: TradeParticipantPublic;
  receiver?: TradeParticipantPublic;
  items: TradeDetailItem[];
};

type ListTradesResponse = { items: TradeListItem[] };
type TradeResponse = { trade: TradeDetail };

export type CreateTradeDto = {
  receiverUserId: number;
  offeredUserBookIds: number[];
  requestedUserBookIds?: number[];
};

export type CreateUserBookDto = {
  catalogBookId?: number;
  title?: string;
  author?: string;
  isbn?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  imageUrls?: string[];
  condition?: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'ACCEPTABLE' | 'WORN';
  categoryIds?: number[];
};

export type PurchasedCatalogRow = {
  catalogBookId: number;
  title: string;
  author: string;
  coverUrl?: string;
};

@Injectable({ providedIn: 'root' })
export class TruequeService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ordersService = inject(OrdersService);

  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private tradesUrl = `${this.baseUrl}/trades`;
  private userBooksUrl = `${this.baseUrl}/user-books`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      map((token) => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        } else if (!environment.production) {
          const id = this.authService.currentUser()?.id ?? 1;
          headers = headers.set('x-dev-user-id', String(id));
        }
        return headers;
      }),
    );
  }

  listAvailable(query?: ListAvailableQuery): Observable<UserBooksListResponse> {
    let params = new HttpParams();
    const q = query ?? {};
    if (q.page != null) params = params.set('page', String(q.page));
    if (q.limit != null) params = params.set('limit', String(q.limit));
    if (q.search?.trim()) params = params.set('search', q.search.trim());
    if (q.ownerId != null) params = params.set('ownerId', String(q.ownerId));
    if (q.categoryId != null) params = params.set('categoryId', String(q.categoryId));
    if (q.condition) params = params.set('condition', q.condition);

    return this.http.get<UserBooksListResponse>(this.userBooksUrl, { params });
  }

  getMyBooks(): Observable<UserBookListItem[]> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<MyUserBooksResponse>(`${this.userBooksUrl}/mine`, { headers })),
      map((r) => r.items),
    );
  }

  getUserBookById(id: number): Observable<UserBookDetail> {
    return this.http.get<UserBookDetailResponse>(`${this.userBooksUrl}/${id}`).pipe(map((r) => r.book));
  }

  createUserBook(dto: CreateUserBookDto): Observable<UserBookDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.post<UserBookDetailResponse>(this.userBooksUrl, dto, { headers }),
      ),
      map((r) => r.book),
    );
  }

  deleteUserBook(id: number): Observable<void> {
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.userBooksUrl}/${id}`, { headers, observe: 'response' }),
      ),
      map(() => undefined),
    );
  }

  /**
   * Libros del catálogo deduplicados desde el historial de pedidos (para añadir a la biblioteca con `catalogBookId`).
   */
  getFromPurchases(): Observable<PurchasedCatalogRow[]> {
    return this.ordersService.getOrderHistory().pipe(
      map((orders: Order[]) => {
        const seen = new Map<number, PurchasedCatalogRow>();
        for (const order of orders) {
          if (order.status === 'CANCELLED') continue;
          for (const line of order.items) {
            if (seen.has(line.catalogBookId)) continue;
            seen.set(line.catalogBookId, {
              catalogBookId: line.catalogBookId,
              title: line.catalogBook.title,
              author: line.catalogBook.author,
              coverUrl: line.catalogBook.coverUrl ?? line.catalogBook.imageUrls?.[0],
            });
          }
        }
        return [...seen.values()];
      }),
    );
  }

  listMine(): Observable<TradeListItem[]> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<ListTradesResponse>(this.tradesUrl, { headers })),
      map((r) => r.items),
    );
  }

  getById(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<TradeResponse>(`${this.tradesUrl}/${id}`, { headers })),
      map((r) => r.trade),
    );
  }

  create(dto: CreateTradeDto): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(this.tradesUrl, dto, { headers })),
      map((r) => r.trade),
    );
  }

  accept(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.tradesUrl}/${id}/accept`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  reject(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.tradesUrl}/${id}/reject`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  cancel(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.tradesUrl}/${id}/cancel`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  complete(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.tradesUrl}/${id}/complete`, {}, { headers })),
      map((r) => r.trade),
    );
  }
}
