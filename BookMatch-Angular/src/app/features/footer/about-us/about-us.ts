import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

@Component({
  selector: 'app-about-us',
  imports: [TranslateModule, Header, Footer],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
})
export class AboutUs {

}
