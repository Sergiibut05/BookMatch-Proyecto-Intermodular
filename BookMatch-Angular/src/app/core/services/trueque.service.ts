import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type TradeStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';

export type TradeListItem = {
  id: number;
  status: TradeStatus;
  senderId: number;
  receiverId: number;
  createdAt: string;
  updatedAt: string;
};

export type TradeDetail = TradeListItem & {
  items: Array<{
    id: number;
    tradeId: number;
    userBookId: number;
    side: 'SENDER' | 'RECEIVER';
    createdAt: string;
  }>;
};

type ListTradesResponse = {
  items: TradeListItem[];
};

type TradeResponse = {
  trade: TradeDetail;
};

export type CreateTradeDto = {
  receiverUserId: number;
  offeredUserBookIds: number[];
  requestedUserBookIds?: number[];
};

@Injectable({ providedIn: 'root' })
export class TruequeService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;
  private apiUrl = `${this.baseUrl}/trades`;

  private authHeaders(): Observable<HttpHeaders> {
    return this.authService.getToken().pipe(
      map((token) => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        } else if (!environment.production) {
          headers = headers.set('x-dev-user-id', '1');
        }
        return headers;
      }),
    );
  }

  listMine(): Observable<TradeListItem[]> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<ListTradesResponse>(this.apiUrl, { headers })),
      map((r) => r.items),
    );
  }

  getById(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.get<TradeResponse>(`${this.apiUrl}/${id}`, { headers })),
      map((r) => r.trade),
    );
  }

  create(dto: CreateTradeDto): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(this.apiUrl, dto, { headers })),
      map((r) => r.trade),
    );
  }

  accept(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.apiUrl}/${id}/accept`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  reject(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.apiUrl}/${id}/reject`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  cancel(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.apiUrl}/${id}/cancel`, {}, { headers })),
      map((r) => r.trade),
    );
  }

  complete(id: number): Observable<TradeDetail> {
    return this.authHeaders().pipe(
      switchMap((headers) => this.http.post<TradeResponse>(`${this.apiUrl}/${id}/complete`, {}, { headers })),
      map((r) => r.trade),
    );
  }
}

