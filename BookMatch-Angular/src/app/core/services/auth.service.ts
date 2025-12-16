import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
        signInWithPopup, GoogleAuthProvider, signOut, user, User as FirebaseUser, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, from, map, switchMap, of } from 'rxjs';
import { User as BackendUser } from '@shared/models'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private readonly API_URL = 'http://localhost:3000/api'; 
  private readonly TOKEN_KEY = 'firebase_token';

  // Señal que guarda al usuario con datos combinados
  currentUser = signal<BackendUser | null>(null);
  
  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem(this.TOKEN_KEY, token);

        // Llamamos al backend para obtener ID y otros datos
        this.fetchBackendProfile(token).subscribe({
          next: (dbUser) => {
            // --- FUSIÓN ROBUSTA DE DATOS ---
            // Usamos los datos de Firebase si los de la BD son null o string vacío ""
            const mergedUser: BackendUser = {
              ...dbUser,
              fullName: dbUser.fullName || firebaseUser.displayName || 'Usuario',
              avatarUrl: dbUser.avatarUrl || firebaseUser.photoURL || undefined
            };
            
            console.log('✅ Usuario cargado y fusionado:', mergedUser);
            this.currentUser.set(mergedUser); 
          },
          error: (err) => {
            console.error('❌ Error sincronizando perfil:', err);
            this.currentUser.set(null); 
          }
        });

      } else {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
      }
    });
  }

  private fetchBackendProfile(token: string): Observable<BackendUser> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<BackendUser>(`${this.API_URL}/users/profile`, { headers });
  }
  
  // --- Resto de métodos (login, register, etc.) SIN CAMBIOS ---
  
  register(email: string, password: string, name: string, surname: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(({ user }) =>
        from(updateProfile(user, { displayName: `${name} ${surname}` })).pipe(
          map(() => ({ user }))
        )
      )
    );
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(signInWithPopup(this.auth, provider));
  }

  logout(): Observable<any> {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    return from(signOut(this.auth));
  }

  isAuthenticated(): boolean {
    if (this.currentUser() !== null) return true;
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): Observable<string | null> {
    // Usar el observable user$ en lugar de acceder directamente a currentUser
    // para evitar el warning de AngularFire sobre el contexto de inyección
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

  async updateProfile(profileData: { displayName?: string; photoURL?: string }): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    await updateProfile(user, profileData);
    await user.getIdToken(true);
  }
}