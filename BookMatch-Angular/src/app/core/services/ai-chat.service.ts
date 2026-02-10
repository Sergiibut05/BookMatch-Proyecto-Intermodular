import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface ChatMessage {
  userId: number;
  message: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private http = inject(HttpClient);
  private readonly WEBHOOK_URL = 'http://98.84.24.135:5678/webhook/firebase';
  private readonly TIMEOUT_MS = 120000; // 2 minutos de timeout

  sendMessage(userId: number, message: string, baseUrl: string): Observable<string> {
    const payload: ChatMessage = {
      userId,
      message,
      url: baseUrl
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });



    return this.http.post(this.WEBHOOK_URL, payload, {
      headers,
      responseType: 'text'
    }).pipe(
      timeout(this.TIMEOUT_MS),
      map((response: string) => {

        return response;
      }),
      catchError((error) => {

        return throwError(() => error);
      })
    );
  }
}