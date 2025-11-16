import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
         signInWithPopup, GoogleAuthProvider, signOut, user, User, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);
  private readonly TOKEN_KEY = 'firebase_token';
  user$ = user(this.auth);

  constructor() {
    // Escuchar cambios en el estado de autenticación
    this.user$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        user.getIdToken().then(token => {
          localStorage.setItem(this.TOKEN_KEY, token);
        });
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    });

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        user.getIdToken().then(token => {
          localStorage.setItem(this.TOKEN_KEY, token);
        });
      }
    });
  }

  
  
  // Registro con email y contraseña
  register(email: string, password: string, name: string, surname: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(({ user }) =>
        from(updateProfile(user, { displayName: `${name} ${surname}` })).pipe(
          map(() => ({ user }))
        )
      )
    );
  }

  // Login con email y contraseña
  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  // Login con Google
  loginWithGoogle(): Observable<any> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return from(signInWithPopup(this.auth, provider));
  }

  // Cerrar sesión
  logout(): Observable<any> {
    localStorage.removeItem(this.TOKEN_KEY);
    return from(signOut(this.auth));
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  async getToken(): Promise<string | null> {
    const user = this.currentUser();
    if (user) {
      const token = await user.getIdToken();
      localStorage.setItem(this.TOKEN_KEY, token);
      return token;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }
}