import {
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { LandingScene } from './landing-scene';
import { setupLandingScroll } from './landing-scroll';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [TranslateModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent implements OnDestroy {
  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scrollContainer', { static: false }) scrollRef!: ElementRef<HTMLElement>;

  private authService = inject(AuthService);
  private router = inject(Router);

  private scene: LandingScene | null = null;
  private killScroll: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  private observer: IntersectionObserver | null = null;

  loading = signal(true);
  loadProgress = signal(0);
  currentYear = new Date().getFullYear();

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    const sub = this.authService.user$.subscribe((fbUser) => {
      if (fbUser) {
        this.router.navigate(['/home']);
      }
      sub.unsubscribe();
    });

    afterNextRender(() => this.initScene());
  }

  private async initScene(): Promise<void> {
    const canvas = this.canvasRef?.nativeElement;
    const scrollEl = this.scrollRef?.nativeElement;
    if (!canvas || !scrollEl) return;

    this.scene = new LandingScene(canvas);

    await this.scene.loadBook((pct) => this.loadProgress.set(pct));
    this.loading.set(false);

    this.scene.startRenderLoop();

    this.killScroll = setupLandingScroll(
      this.scene.getRefs(),
      scrollEl,
      this.scene.isMobile,
    );

    this.resizeHandler = () => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.scene?.handleResize();

        if (this.killScroll) this.killScroll();
        if (this.scene && this.scrollRef?.nativeElement) {
          this.killScroll = setupLandingScroll(
            this.scene.getRefs(),
            this.scrollRef.nativeElement,
            this.scene.isMobile,
          );
        }
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener('resize', this.resizeHandler);

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.scene?.pause();
      } else {
        this.scene?.resume();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.scene?.resume();
        } else {
          this.scene?.pause();
        }
      },
      { threshold: 0.05 },
    );
    this.observer.observe(canvas);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.scene.setIdleAmplitude(0);
    }
  }

  ngOnDestroy(): void {
    if (this.killScroll) this.killScroll();
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.observer) this.observer.disconnect();
    this.scene?.dispose();
  }
}
