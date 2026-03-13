import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

/** Página estática de términos y condiciones del servicio. */
@Component({
  selector: 'app-terms-and-conditions',
  imports: [RouterLink, Header, Footer],
  templateUrl: './terms-and-conditions.html',
  styleUrl: './terms-and-conditions.scss',
})
export class TermsAndConditions {

}
