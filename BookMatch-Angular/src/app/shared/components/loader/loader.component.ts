import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  fadeOut = false;

  ngOnInit(): void {
    // Simular carga de 2 segundos
    setTimeout(() => {
      this.fadeOut = true;
    }, 2000);
  }
}
