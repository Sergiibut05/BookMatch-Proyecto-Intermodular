import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Header } from '@shared/components/header/header';
import { Carousel } from '@shared/components/carousel/carousel';


@Component({
  selector: 'app-home',
  imports: [CommonModule, Header, Carousel],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  authService = inject(AuthService);
  private router = inject(Router);
}