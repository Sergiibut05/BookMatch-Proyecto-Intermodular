import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  private readonly WEBHOOK_URL = 'http://localhost:5678/webhook/recommend/books';

  sendMessage(userId: number, message: string, baseUrl: string): Observable<string> {
    const payload: ChatMessage = {
      userId,
      message,
      url: baseUrl
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log('📤 Enviando mensaje a n8n:', payload);

    return this.http.post(this.WEBHOOK_URL, payload, {
      headers,
      responseType: 'text'
    }).pipe(
      map((response: string) => {
        console.log('📥 Respuesta recibida de n8n:', response);
        return response;
      }),
      catchError((error) => {
        console.error('❌ Error en la petición a n8n:', error);
        console.error('❌ Error completo:', JSON.stringify(error, null, 2));
        if (error.error) {
          console.error('❌ Error.error:', error.error);
        }
        return throwError(() => error);
      })
    );
  }
}

