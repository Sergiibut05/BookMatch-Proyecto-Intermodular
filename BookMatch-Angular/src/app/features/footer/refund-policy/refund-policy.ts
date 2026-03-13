import { Component } from '@angular/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

/** Página estática de política de reembolsos. */
@Component({
  selector: 'app-refund-policy',
  imports: [Header, Footer],
  templateUrl: './refund-policy.html',
  styleUrl: './refund-policy.scss',
})
export class RefundPolicy {

}
