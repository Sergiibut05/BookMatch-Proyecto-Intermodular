import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
        signInWithPopup, GoogleAuthProvider, signOut, user, User as FirebaseUser, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, from, map, switchMap, of } from 'rxjs';
import { User as BackendUser } from '@shared/models'; 
import { environment } from '../../../environments/environment';

/**
 * Servicio de autenticacion y sesion de BookMatch.
 *
 * Orquesta el login/registro con Firebase y la sincronizacion del perfil
 * del backend, exponiendo estado reactivo con signals para la UI.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl; 
  private readonly TOKEN_KEY = 'firebase_token';

  currentUser = signal<BackendUser | null>(null);
  firebaseUser = signal<FirebaseUser | null>(null);
  
  isAdmin = computed(() => {
    return this.currentUser()?.role === 'ADMIN';
  })

  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        this.firebaseUser.set(firebaseUser);
        const token = await firebaseUser.getIdToken();
        localStorage.setItem(this.TOKEN_KEY, token);

        this.fetchBackendProfile(token).subscribe({
          next: (dbUser) => {
            const mergedUser: BackendUser = {
              ...dbUser,
              fullName: dbUser.fullName || firebaseUser.displayName || 'Usuario',
              avatarUrl: dbUser.avatarUrl || firebaseUser.photoURL || undefined
            };
            
            this.currentUser.set(mergedUser); 
          },
          error: (err) => {
            this.currentUser.set(null); 
          }
        });

      } else {
        this.firebaseUser.set(null);
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
      }
    });
  }

  /**
   * Obtiene el perfil del usuario autenticado desde el backend.
   *
   * @param token ID token de Firebase
   * @returns Observable con el perfil persistido en la API
   */
  private fetchBackendProfile(token: string): Observable<BackendUser> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<BackendUser>(`${this.API_URL}/users/profile`, { headers });
  }
  
  /**
   * Registra un usuario en Firebase y actualiza su displayName.
   *
   * @param email Correo del usuario
   * @param password Contrasena en texto plano
   * @param name Nombre
   * @param surname Apellidos
   * @returns Observable con el resultado del alta
   *
   * @example
   * ```ts
   * this.authService.register('ana@mail.com', 'Secret123', 'Ana', 'Lopez')
   *   .subscribe(() => this.router.navigate(['/home']));
   * ```
   */
  register(email: string, password: string, name: string, surname: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(({ user }) =>
        from(updateProfile(user, { displayName: `${name} ${surname}` })).pipe(
          map(() => ({ user }))
        )
      )
    );
  }

  /**
   * Inicia sesion con email y contrasena.
   *
   * @param email Correo del usuario
   * @param password Contrasena del usuario
   * @returns Observable con la credencial de Firebase
   *
   * @example
   * ```ts
   * this.authService.login(email, password).subscribe({
   *   next: () => this.router.navigate(['/home'])
   * });
   * ```
   */
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * Inicia sesion con proveedor Google OAuth.
   *
   * @returns Observable con la credencial social
   *
   * @example
   * ```ts
   * this.authService.loginWithGoogle().subscribe();
   * ```
   */
  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(signInWithPopup(this.auth, provider));
  }

  /**
   * Cierra la sesion actual y limpia estado local.
   *
   * @returns Observable que completa al cerrar sesion
   */
  logout(): Observable<any> {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    return from(signOut(this.auth));
  }

  /**
   * Comprueba si existe sesion activa o token persistido.
   *
   * @returns `true` si el usuario esta autenticado, `false` en caso contrario
   */
  isAuthenticated(): boolean {
    if (this.currentUser() !== null) return true;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Recupera un token valido del usuario actual.
   *
   * Si existe usuario en Firebase fuerza la lectura del token y lo persiste.
   * Si no, devuelve el token cacheado en localStorage.
   *
   * @returns Observable con token JWT o `null`
   *
   * @example
   * ```ts
   * this.authService.getToken().subscribe((token) => {
   *   if (token) {
   *     headers = headers.set('Authorization', `Bearer ${token}`);
   *   }
   * });
   * ```
   */
  getToken(): Observable<string | null> {
    return this.user$.pipe(
      switchMap(async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem(this.TOKEN_KEY, token);
          return token;
        }
        return localStorage.getItem(this.TOKEN_KEY);
      })
    );
  }

  /**
   * Actualiza campos de perfil en Firebase Auth.
   *
   * @param profileData Campos de perfil soportados por Firebase
   * @returns Promise que finaliza cuando el token se refresca
   *
   * @example
   * ```ts
   * await this.authService.updateProfile({ displayName: 'Ana Lopez' });
   * ```
   */
  async updateProfile(profileData: { displayName?: string; photoURL?: string }): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    await updateProfile(user, profileData);
    await user.getIdToken(true);
  }
}