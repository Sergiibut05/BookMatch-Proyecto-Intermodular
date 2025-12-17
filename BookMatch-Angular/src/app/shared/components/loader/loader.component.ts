import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-loader',
  imports: [TranslateModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  fadeOut = false;

  ngOnInit(): void {
    setTimeout(() => {
      this.fadeOut = true;
    }, 2000);
  }
}
