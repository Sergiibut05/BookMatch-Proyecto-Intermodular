import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-frequent-questions',
  imports: [CommonModule, TranslateModule, Header, Footer],
  templateUrl: './frequent-questions.html',
  styleUrl: './frequent-questions.scss',
})
export class FrequentQuestions {
  faqs: FAQ[] = [
    { id: 1, question: 'FAQ.Q1', answer: 'FAQ.A1', isOpen: false },
    { id: 2, question: 'FAQ.Q2', answer: 'FAQ.A2', isOpen: false },
    { id: 3, question: 'FAQ.Q3', answer: 'FAQ.A3', isOpen: false },
    { id: 4, question: 'FAQ.Q4', answer: 'FAQ.A4', isOpen: false },
    { id: 5, question: 'FAQ.Q5', answer: 'FAQ.A5', isOpen: false },
    { id: 6, question: 'FAQ.Q6', answer: 'FAQ.A6', isOpen: false },
    { id: 7, question: 'FAQ.Q7', answer: 'FAQ.A7', isOpen: false },
    { id: 8, question: 'FAQ.Q8', answer: 'FAQ.A8', isOpen: false },
  ];

  toggleFaq(id: number): void {
    const faq = this.faqs.find(f => f.id === id);
    if (faq) {
      faq.isOpen = !faq.isOpen;
    }
  }
}
