import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from './shared/components/loader/loader.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit{
  protected readonly title = signal('BookMatch-Angular');
  showLoader = signal(true);

  constructor() {
    // Agregar la clase inmediatamente al iniciar (loader empieza visible)
    if (typeof document !== 'undefined') {
      document.body.classList.add('loader-active');
    }
    
    // Agregar o remover clase al body cuando el loader cambia
    effect(() => {
      const loaderVisible = this.showLoader();
      if (loaderVisible) {
        document.body.classList.add('loader-active');
      } else {
        document.body.classList.remove('loader-active');
      }
    });
  }

  ngOnInit(): void {
    // Ocultar el loader después de 2.5 segundos
    setTimeout(() => {
      this.showLoader.set(false);
    }, 2500);
  }
}
