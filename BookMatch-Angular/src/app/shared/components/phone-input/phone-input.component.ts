import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  signal,
  forwardRef,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface PhoneCountry {
  code: string;
  flag: string;
  dialCode: string;
  name: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'ES', flag: '🇪🇸', dialCode: '+34', name: 'España' },
  { code: 'US', flag: '🇺🇸', dialCode: '+1', name: 'EE. UU.' },
  { code: 'MX', flag: '🇲🇽', dialCode: '+52', name: 'México' },
  { code: 'AR', flag: '🇦🇷', dialCode: '+54', name: 'Argentina' },
  { code: 'CO', flag: '🇨🇴', dialCode: '+57', name: 'Colombia' },
  { code: 'CL', flag: '🇨🇱', dialCode: '+56', name: 'Chile' },
  { code: 'PE', flag: '🇵🇪', dialCode: '+51', name: 'Perú' },
  { code: 'VE', flag: '🇻🇪', dialCode: '+58', name: 'Venezuela' },
  { code: 'EC', flag: '🇪🇨', dialCode: '+593', name: 'Ecuador' },
  { code: 'BO', flag: '🇧🇴', dialCode: '+591', name: 'Bolivia' },
  { code: 'UY', flag: '🇺🇾', dialCode: '+598', name: 'Uruguay' },
  { code: 'PY', flag: '🇵🇾', dialCode: '+595', name: 'Paraguay' },
  { code: 'PT', flag: '🇵🇹', dialCode: '+351', name: 'Portugal' },
  { code: 'BR', flag: '🇧🇷', dialCode: '+55', name: 'Brasil' },
  { code: 'GB', flag: '🇬🇧', dialCode: '+44', name: 'Reino Unido' },
  { code: 'DE', flag: '🇩🇪', dialCode: '+49', name: 'Alemania' },
  { code: 'FR', flag: '🇫🇷', dialCode: '+33', name: 'Francia' },
  { code: 'IT', flag: '🇮🇹', dialCode: '+39', name: 'Italia' },
  { code: 'RO', flag: '🇷🇴', dialCode: '+40', name: 'Rumanía' },
  { code: 'UA', flag: '🇺🇦', dialCode: '+380', name: 'Ucrania' },
  { code: 'MA', flag: '🇲🇦', dialCode: '+212', name: 'Marruecos' },
  { code: 'CN', flag: '🇨🇳', dialCode: '+86', name: 'China' },
];

/** Intenta parsear un número completo tipo "+34 612345678" en (country, localNumber). */
function parseFullPhone(value: string): { country: PhoneCountry; local: string } {
  const fallback = PHONE_COUNTRIES[0];
  if (!value?.trim()) return { country: fallback, local: '' };

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (value.startsWith(c.dialCode)) {
      return { country: c, local: value.slice(c.dialCode.length).trimStart() };
    }
  }
  return { country: fallback, local: value };
}

/**
 * Selector de prefijo internacional con bandera + campo de número.
 * Implementa ControlValueAccessor para usarse con reactive forms (formControlName)
 * y también acepta [value] / (valueChange) para uso sin formulario.
 *
 * El valor emitido es el número completo: "+34 612345678".
 *
 * El dropdown se inyecta directamente en document.body como portal, escapando
 * cualquier transform / backdrop-filter / overflow:hidden de los modales.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex items-center rounded-xl border border-[#E9E1D1] bg-white/90 focus-within:ring-2 focus-within:ring-[#E0A15E]/50 overflow-hidden"
         [class.opacity-50]="isDisabled()"
         [class.pointer-events-none]="isDisabled()">

      <!-- Botón selector de país -->
      <button
        #triggerBtn
        type="button"
        class="flex items-center gap-1.5 px-3 py-2.5 border-r border-[#E9E1D1] bg-[#FBF3E4] hover:bg-[#F5EAD2] active:bg-[#EDD9B8] transition-colors shrink-0 self-stretch focus:outline-none"
        (click)="togglePortal($event)"
        [attr.aria-expanded]="dropdownOpen()">
        <span class="text-sm" style="line-height:1">{{ selectedCountry().flag }}</span>
        <span class="text-sm font-semibold text-[#45332D] tabular-nums">{{ selectedCountry().dialCode }}</span>
        <svg class="w-3 h-3 text-[#8a6a52] shrink-0 transition-transform duration-150"
             [class.rotate-180]="dropdownOpen()"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <!-- Input número local -->
      <input
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        class="flex-1 min-w-0 px-3 py-2.5 text-sm text-[#45332D] bg-transparent placeholder:text-[#8a6a52]/70 focus:outline-none"
        [value]="localNumber()"
        [placeholder]="placeholder"
        (input)="onLocalInput($event)"
        (blur)="onTouched()" />
    </div>
  `,
})
export class PhoneInputComponent implements OnChanges, OnDestroy, ControlValueAccessor {
  @Input() value = '';
  @Input() placeholder = '612 345 678';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;

  readonly countries = PHONE_COUNTRIES;

  selectedCountry = signal<PhoneCountry>(PHONE_COUNTRIES[0]);
  localNumber = signal('');
  isDisabled = signal(false);
  dropdownOpen = signal(false);

  private portalEl: HTMLElement | null = null;
  private cvaOnChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) this.applyValue(this.value);
    if (changes['disabled']) this.isDisabled.set(this.disabled);
  }

  ngOnDestroy(): void {
    this.closePortal();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.portalEl) return;
    const trigger = this.triggerBtn?.nativeElement;
    if (trigger?.contains(event.target as Node)) return;
    if (this.portalEl.contains(event.target as Node)) return;
    this.closePortal();
  }

  togglePortal(event: MouseEvent): void {
    event.stopPropagation();
    if (this.portalEl) {
      this.closePortal();
    } else {
      this.openPortal();
    }
  }

  onLocalInput(event: Event): void {
    this.localNumber.set((event.target as HTMLInputElement).value);
    this.emit();
    this.onTouched();
  }

  private openPortal(): void {
    const rect = this.triggerBtn.nativeElement.getBoundingClientRect();
    const listH = Math.min(PHONE_COUNTRIES.length * 40 + 8, 256);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= listH ? rect.bottom + 4 : rect.top - listH - 4;

    const ul = document.createElement('ul');
    ul.setAttribute('role', 'listbox');
    Object.assign(ul.style, {
      position: 'fixed',
      top: `${top}px`,
      left: `${rect.left}px`,
      width: '264px',
      maxHeight: '256px',
      overflowY: 'auto',
      background: '#fffaf0',
      border: '1px solid #E9E1D1',
      borderRadius: '14px',
      boxShadow: '0 8px 32px -8px rgba(69,51,45,0.22), 0 2px 8px -2px rgba(69,51,45,0.10)',
      padding: '4px 0',
      zIndex: '99999',
      fontFamily: 'inherit',
      fontSize: '14px',
      animation: 'bmPhoneDropIn 140ms cubic-bezier(0.16,1,0.3,1) forwards',
    });

    // Inyectar keyframe si no existe todavía
    if (!document.getElementById('bm-phone-drop-kf')) {
      const style = document.createElement('style');
      style.id = 'bm-phone-drop-kf';
      style.textContent = `
        @keyframes bmPhoneDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `;
      document.head.appendChild(style);
    }

    for (const country of PHONE_COUNTRIES) {
      const isSelected = country.code === this.selectedCountry().code;
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(isSelected));
      Object.assign(li.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        color: '#45332D',
        background: isSelected ? '#FBF3E4' : 'transparent',
        fontWeight: isSelected ? '600' : '400',
        transition: 'background 100ms',
      });

      li.addEventListener('mouseenter', () => { li.style.background = '#FBF3E4'; });
      li.addEventListener('mouseleave', () => { li.style.background = isSelected ? '#FBF3E4' : 'transparent'; });

      const flagSpan = document.createElement('span');
      flagSpan.textContent = country.flag;
      flagSpan.style.cssText = 'font-size:15px; line-height:1; flex-shrink:0';

      const nameSpan = document.createElement('span');
      nameSpan.textContent = country.name;
      nameSpan.style.cssText = 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#45332D';

      const codeSpan = document.createElement('span');
      codeSpan.textContent = country.dialCode;
      codeSpan.style.cssText = 'color:#8a6a52; font-size:12px; font-weight:600; flex-shrink:0; font-variant-numeric:tabular-nums';

      li.append(flagSpan, nameSpan, codeSpan);
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedCountry.set(country);
        this.emit();
        this.onTouched();
        this.closePortal();
      });

      ul.appendChild(li);
    }

    document.body.appendChild(ul);
    this.portalEl = ul;
    this.dropdownOpen.set(true);
  }

  private closePortal(): void {
    if (this.portalEl) {
      document.body.removeChild(this.portalEl);
      this.portalEl = null;
    }
    this.dropdownOpen.set(false);
  }

  private emit(): void {
    const local = this.localNumber().trim();
    const full = local ? `${this.selectedCountry().dialCode} ${local}` : '';
    this.valueChange.emit(full);
    this.cvaOnChange(full);
  }

  private applyValue(value: string): void {
    const { country, local } = parseFullPhone(value ?? '');
    this.selectedCountry.set(country);
    this.localNumber.set(local);
  }

  writeValue(value: string | null): void { this.applyValue(value ?? ''); }
  registerOnChange(fn: (val: string) => void): void { this.cvaOnChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
