import { Component, OnDestroy, afterNextRender, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnDestroy {
  private router      = inject(Router);
  private authService = inject(AuthService);

  mobileMenuOpen = false;

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }
    const sub = this.authService.user$.subscribe(user => {
      if (user) this.router.navigate(['/home']);
      sub.unsubscribe();
    });
    afterNextRender(() => this.initAnimations());
  }

  private initAnimations(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sections = document.querySelectorAll<HTMLElement>('.anim-section');
    sections.forEach((el) => {
      gsap.fromTo(
        el,
        { y: 36, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true,
          },
        },
      );
    });

    // Feature cards stagger
    const cards = document.querySelectorAll<HTMLElement>('.feature-card');
    if (cards.length) {
      gsap.fromTo(
        Array.from(cards),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.12,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.features__grid',
            start: 'top 78%',
            once: true,
          },
        },
      );
    }

    // Stats counter-like pop
    const stats = document.querySelectorAll<HTMLElement>('.stat');
    if (stats.length) {
      gsap.fromTo(
        Array.from(stats),
        { y: 20, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.14,
          duration: 0.55,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.social-proof__stats',
            start: 'top 80%',
            once: true,
          },
        },
      );
    }
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}
