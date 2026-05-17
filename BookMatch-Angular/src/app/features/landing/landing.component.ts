import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
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
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly landingRoot = viewChild<ElementRef<HTMLElement>>('landingRoot');

  private gsapLandingCtx?: gsap.Context;

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }
    const sub = this.authService.user$.subscribe(user => {
      if (user) this.router.navigate(['/home']);
      sub.unsubscribe();
    });

    afterNextRender(() => {
      const root = this.landingRoot()?.nativeElement;
      if (!root) return;

      this.document.documentElement.style.scrollBehavior = 'smooth';

      this.gsapLandingCtx = gsap.context(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
          this.initHeroIntro(root);
          this.initParallax(root);
        }
        this.initScrollReveal();
      }, root);
    });
  }

  scrollToFeatures(): void {
    this.document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  private initHeroIntro(root: HTMLElement): void {
    const media = root.querySelector<HTMLElement>('.landing-hero__media');
    const header = root.querySelector<HTMLElement>('.landing-header');
    const eyebrow = root.querySelector<HTMLElement>('.landing-hero-eyebrow');
    const headlineLines = root.querySelectorAll<HTMLElement>(
      '.landing-hero-headline__line',
    );
    const sub = root.querySelector<HTMLElement>('.landing-hero-sub');
    const actions = root.querySelector<HTMLElement>('.landing-hero-foot__actions');
    const scrollBtn = root.querySelector<HTMLElement>('.landing-hero-scroll');
    const scrollIcon = root.querySelector<HTMLElement>('.landing-hero-scroll__icon');

    const fadeTargets = [
      header,
      eyebrow,
      ...Array.from(headlineLines),
      sub,
      actions,
      scrollBtn,
    ].filter((el): el is HTMLElement => !!el);

    const isDesktop = window.matchMedia('(min-width: 901px)').matches;
    const heroScale = isDesktop ? 1.18 : 1.07;

    gsap.set(fadeTargets, { opacity: 0, y: 22, force3D: true });
    if (media) {
      gsap.set(media, {
        scale: heroScale,
        transformOrigin: 'center center',
        force3D: true,
      });
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.out', force3D: true },
    });

    if (media) {
      tl.to(media, { scale: 1, duration: isDesktop ? 2 : 1.5, ease: 'power3.out' }, 0);
    }
    if (header) {
      tl.to(header, { opacity: 1, y: 0, duration: 0.75 }, 0.15);
    }
    if (eyebrow) {
      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.4);
    }
    if (headlineLines.length) {
      tl.to(
        Array.from(headlineLines),
        { opacity: 1, y: 0, duration: 0.95, stagger: 0.14 },
        0.55,
      );
    }
    if (sub) {
      tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5');
    }
    if (actions) {
      tl.to(actions, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
    }
    if (scrollBtn) {
      tl.to(scrollBtn, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35');
    }

    if (scrollIcon) {
      gsap.to(scrollIcon, {
        y: 6,
        repeat: -1,
        yoyo: true,
        duration: 1.4,
        ease: 'sine.inOut',
        delay: 1.6,
      });
    }
  }

  private initParallax(root: HTMLElement): void {
    const media = root.querySelector<HTMLElement>('.landing-hero__media');
    const heroHead = root.querySelector<HTMLElement>('.landing-hero-head');
    const heroFoot = root.querySelector<HTMLElement>('.landing-hero-foot');
    const heroStack = root.querySelector<HTMLElement>('.hero-stack');

    if (!heroStack) return;

    // Imagen hero: se mueve al 40% de la velocidad de scroll → profundidad
    if (media) {
      gsap.to(media, {
        y: '-20%',
        ease: 'none',
        scrollTrigger: {
          trigger: heroStack,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Titular: sube y desaparece suavemente al salir del hero
    if (heroHead) {
      gsap.to(heroHead, {
        y: -50,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroStack,
          start: 'top top',
          end: '50% top',
          scrub: 1,
        },
      });
    }

    // Footer hero (botón descubre más): fade-out más rápido
    if (heroFoot) {
      gsap.to(heroFoot, {
        y: -35,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroStack,
          start: 'top top',
          end: '38% top',
          scrub: 1,
        },
      });
    }

  }

  private initScrollReveal(): void {
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
    this.gsapLandingCtx?.revert();
    this.document.documentElement.style.scrollBehavior = '';
  }
}
