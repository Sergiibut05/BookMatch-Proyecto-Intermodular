import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

@Component({
  selector: 'app-payment-methods',
  imports: [TranslateModule, Header, Footer],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss',
})
export class PaymentMethods {

}
