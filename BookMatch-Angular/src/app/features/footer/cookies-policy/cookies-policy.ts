import { Component } from '@angular/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

@Component({
  selector: 'app-cookies-policy',
  imports: [Header, Footer],
  templateUrl: './cookies-policy.html',
  styleUrl: './cookies-policy.scss',
})
export class CookiesPolicy {
  lastUpdatedDate: string = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
