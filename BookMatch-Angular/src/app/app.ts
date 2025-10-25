import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
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

  ngOnInit(): void {
    // Ocultar el loader después de 2.5 segundos
    setTimeout(() => {
      this.showLoader.set(false);
    }, 2500);
  }
}
