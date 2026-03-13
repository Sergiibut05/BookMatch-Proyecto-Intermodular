import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

/** Payload enviado al webhook de IA: usuario, mensaje y URL base de la app. */
export interface ChatMessage {
  /** ID del usuario en backend. */
  userId: number;
  /** Texto del mensaje del usuario. */
  message: string;
  /** URL base de la aplicación. */
  url: string;
}

/**
 * Servicio de chat con IA: envía mensajes a un webhook externo y devuelve la respuesta en texto.
 * Usa timeout de 2 minutos; propaga errores de red o timeout.
 */
@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private http = inject(HttpClient);
  private readonly WEBHOOK_URL = 'http://13.48.29.235:5678/webhook/prueba';
  private readonly TIMEOUT_MS = 120000; // 2 minutos de timeout

  /**
   * Envía un mensaje al webhook de IA y devuelve la respuesta como string.
   * @param userId ID del usuario en backend
   * @param message Texto del mensaje del usuario
   * @param baseUrl URL base de la aplicación (para contexto)
   * @returns Observable con la respuesta en texto del asistente
   */
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