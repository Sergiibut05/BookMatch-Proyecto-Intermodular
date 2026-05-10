import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges {
  @Input('appCountUp') endValue: number | string = 0;
  @Input() duration: number = 600; // ~600ms default
  @Input() decimals: number = 0;
  @Input() prefix: string = '';
  @Input() suffix: string = '';

  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);
  
  private animationFrameId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['endValue'] && changes['endValue'].currentValue !== undefined) {
      this.animate();
    }
  }

  private animate(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.setElementText(this.formatValue(Number(this.endValue)));
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetValue = Number(this.endValue) || 0;

    if (prefersReducedMotion || targetValue === 0) {
      this.setElementText(this.formatValue(targetValue));
      return;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const startValue = 0;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / this.duration, 1);
      
      // easeOutExpo for a nice fast-start, slow-end curve
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      
      this.setElementText(this.formatValue(currentValue));

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        this.setElementText(this.formatValue(targetValue));
      }
    };

    this.animationFrameId = requestAnimationFrame(updateCounter);

    // Ensure we clean up if the directive is destroyed during animation
    this.destroyRef.onDestroy(() => {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  private formatValue(value: number): string {
    const isFloat = value % 1 !== 0 || this.decimals > 0;
    let formattedNumber = '';
    
    if (isFloat) {
      // Use local formatting for thousands separators if needed, or simple fixed
      formattedNumber = Number(value.toFixed(this.decimals || 2)).toLocaleString('es-ES', { minimumFractionDigits: this.decimals || 2, maximumFractionDigits: this.decimals || 2 });
    } else {
      formattedNumber = Math.round(value).toLocaleString('es-ES');
    }
    
    return `${this.prefix}${formattedNumber}${this.suffix}`;
  }

  private setElementText(text: string): void {
    this.el.nativeElement.innerText = text;
  }
}
