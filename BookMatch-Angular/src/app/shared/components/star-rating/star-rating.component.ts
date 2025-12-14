import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * StarRatingComponent - Componente de selección de estrellas para formularios reactivos
 */

@Component({
  selector: 'app-star-rating',
  standalone: true,
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true
    }
  ]
})
export class StarRatingComponent implements ControlValueAccessor {
  // Signal para el valor del rating (0-5)
  private readonly rating = signal<number>(0);
  
  // Estado de hover para mostrar preview visual
  readonly hoverRating = signal<number>(0);
  
  // Estado de deshabilitado usando signal
  private readonly disabled = signal<boolean>(false);
  
  // Array para iterar las 5 estrellas
  readonly stars = [1, 2, 3, 4, 5] as const;

  // Funciones de callback de Angular Forms
  private onChange = (value: number) => {};
  private onTouched = () => {};

  
  // IMPLEMENTACIÓN DE ControlValueAccessor (funciones obligatorias para que el componente funcione con ControlValueAccessor)

  writeValue(value: number): void {
    const newValue = value !== undefined && value !== null ? value : 0;
    this.rating.set(newValue);
  }

  
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }


  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // MÉTODOS DEL COMPONENTE (Lógica de UI)

  /**
   * Obtiene el valor actual del rating
   */
  getValue(): number {
    return this.rating();
  }

  /**
   * Verifica si el componente está deshabilitado
   */
  isDisabled(): boolean {
    return this.disabled();
  }

  /**
   * Al hacer click en una estrella, actualizamos el signal y notificamos a Angular Forms del cambio.
   * También marcamos como touched para que el formulario se valide.
   */
  onStarClick(rating: number): void {
    if (this.disabled()) return;
    
    this.rating.set(rating);
    
    this.onChange(rating);
    
    this.onTouched();
  }

  /**
   * Solo actualiza el preview visual, no cambia el valor real.
   */
  onStarHover(rating: number): void {
    if (this.disabled()) return;
    this.hoverRating.set(rating);
  }

  /**
   * Resetea el preview visual.
   */
  onMouseLeave(): void {
    this.hoverRating.set(0);
  }

  /**
   * Determina si una estrella debe mostrarse llena o vacía.
   */
  isStarFilled(star: number): boolean {
    const displayRating = this.hoverRating() || this.rating();
    return star <= displayRating;
  }
}

