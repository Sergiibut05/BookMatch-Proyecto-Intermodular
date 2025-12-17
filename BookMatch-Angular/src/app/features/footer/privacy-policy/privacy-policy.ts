import { Component } from '@angular/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

@Component({
  selector: 'app-privacy-policy',
  imports: [Header, Footer],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  lastUpdatedDate: string = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
