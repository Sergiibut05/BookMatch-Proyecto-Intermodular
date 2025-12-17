import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
        signInWithPopup, GoogleAuthProvider, signOut, user, User as FirebaseUser, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { Observable, from, map, switchMap, of } from 'rxjs';
import { User as BackendUser } from '@shared/models'; 
import { environment } from '../../../environments/environment';

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
  
  isAdmin = computed(() => {
    return this.currentUser()?.role === 'ADMIN';
  })

  user$ = user(this.auth);

  constructor() {
    this.user$.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
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
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
      }
    });
  }

  private fetchBackendProfile(token: string): Observable<BackendUser> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<BackendUser>(`${this.API_URL}/users/profile`, { headers });
  }
  
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