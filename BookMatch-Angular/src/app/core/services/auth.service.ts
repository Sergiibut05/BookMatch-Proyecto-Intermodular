import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
         signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);
  user$ = user(this.auth);

  constructor() {
    // Escuchar cambios en el estado de autenticación
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // Registro con email y contraseña
  register(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
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
    return from(signOut(this.auth));
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}