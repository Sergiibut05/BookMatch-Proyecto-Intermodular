import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '@shared/components/header/header';
import { Footer } from '@shared/components/footer/footer';
import { TranslateModule } from '@ngx-translate/core';

type TruequeTab = 'news' | 'popular' | 'mine';

type TruequeCard = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
};

@Component({
  selector: 'app-trueque',
  imports: [CommonModule, Header, Footer, TranslateModule],
  templateUrl: './trueque.component.html',
  styleUrl: './trueque.component.scss',
})
export class TruequeComponent {
  activeTab = signal<TruequeTab>('news');

  private allCards: Record<TruequeTab, TruequeCard[]> = {
    news: [
      { id: 'ast-1', title: 'Astérix en Lusitania', author: 'Goscinny, René', coverUrl: 'assets/book-covers/book1.jpg' },
      { id: 'tata-2', title: 'Tatá', author: 'Perrin, Valérie', coverUrl: 'assets/book-covers/book2.jpg' },
      { id: 'asi-3', title: 'La Asistenta', author: 'Mcfadden, Freida', coverUrl: 'assets/book-covers/book3.jpg' },
      { id: 'paj-4', title: 'Los Pájaros', author: 'Vesaas, Tarjei', coverUrl: 'assets/book-covers/book4.jpg' },
      { id: 'op-5', title: 'One Piece Nº111', author: 'Oda, Eiichiro', coverUrl: 'assets/book-covers/book5.jpg' },
      { id: 'fra-6', title: 'Francofacts', author: 'Sánchez, Fernando', coverUrl: 'assets/book-covers/book6.jpg' },
    ],
    popular: [
      { id: 'near-1', title: 'El Nombre del Viento', author: 'Rothfuss, Patrick', coverUrl: 'assets/book-covers/book7.jpg' },
      { id: 'near-2', title: 'Dune', author: 'Herbert, Frank', coverUrl: 'assets/book-covers/book8.jpg' },
      { id: 'near-3', title: '1984', author: 'Orwell, George', coverUrl: 'assets/book-covers/book9.jpg' },
    ],
    mine: [
      { id: 'mine-1', title: 'Sapiens', author: 'Harari, Yuval', coverUrl: 'assets/book-covers/book10.jpg' },
      { id: 'mine-2', title: 'El Hobbit', author: 'Tolkien, J.R.R.', coverUrl: 'assets/book-covers/book11.jpg' },
    ],
  };

  cards = computed(() => this.allCards[this.activeTab()]);

  setTab(tab: TruequeTab) {
    this.activeTab.set(tab);
  }
}

