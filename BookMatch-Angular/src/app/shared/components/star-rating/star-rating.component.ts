import { Component, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * StarRatingComponent - Componente de selección de estrellas con ControlValueAccessor
 * 
 * ¿Qué es ControlValueAccessor?
 * =============================
 * ControlValueAccessor es una interfaz de Angular que permite que un componente personalizado
 * funcione como un campo de formulario nativo (como <input> o <select>).
 * 
 * ¿Por qué es útil?
 * =================
 * Sin ControlValueAccessor, tendrías que manejar manualmente el valor del rating con signals
 * o eventos. Con ControlValueAccessor, puedes usar el componente directamente en formularios
 * reactivos con formControlName="rating", igual que usarías un <input>.
 * 
 * ¿Cómo funciona?
 * ===============
 * Angular Forms necesita 4 cosas para comunicarse con tu componente:
 * 1. writeValue(value) - Angular te dice: "aquí está el valor inicial"
 * 2. registerOnChange(fn) - Angular te dice: "cuando cambies el valor, llama a esta función"
 * 3. registerOnTouched(fn) - Angular te dice: "cuando el usuario toque el componente, avísame"
 * 4. setDisabledState(isDisabled) - Angular te dice: "deshabilita/habilita el componente"
 * 
 * Implementando estos 4 métodos, tu componente se convierte en un "control de formulario"
 * que Angular puede manejar automáticamente.
 */

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  // Valor interno del rating (0-5)
  private _value: number = 0;
  
  // Estado de hover para mostrar preview visual
  hoverRating = signal<number>(0);
  
  // Array para iterar las 5 estrellas
  readonly stars = [1, 2, 3, 4, 5];

  // ============================================
  // MÉTODOS REQUERIDOS POR ControlValueAccessor
  // ============================================

  /**
   * 1. writeValue(value: number)
   * -----------------------------
   * Angular llama este método cuando:
   * - Se inicializa el formulario con un valor
   * - Se usa setValue() o patchValue() en el FormControl
   * - El valor del FormControl cambia desde fuera del componente
   * 
   * Tu trabajo: Actualizar el valor interno del componente
   */
  writeValue(value: number): void {
    if (value !== undefined && value !== null) {
      this._value = value;
    } else {
      this._value = 0;
    }
  }

  /**
   * 2. registerOnChange(fn: Function)
   * ---------------------------------
   * Angular te pasa una función que DEBES llamar cada vez que el usuario
   * cambie el valor del rating.
   * 
   * Guardas esta función para usarla cuando el usuario seleccione estrellas.
   */
  private onChange = (value: number) => {};
  
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  /**
   * 3. registerOnTouched(fn: Function)
   * -----------------------------------
   * Angular te pasa una función que DEBES llamar cuando el usuario
   * "toque" o interactúe con el componente (para marcar como touched).
   * 
   * Esto es importante para validaciones y estados del formulario.
   */
  private onTouched = () => {};
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * 4. setDisabledState(isDisabled: boolean)
   * -----------------------------------------
   * Angular llama este método cuando el FormControl se deshabilita/habilita.
   * 
   * Tu trabajo: Deshabilitar/habilitar la interacción del usuario.
   */
  private _disabled = false;
  
  setDisabledState(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  // ============================================
  // MÉTODOS DEL COMPONENTE (Lógica de UI)
  // ============================================

  /**
   * getValue() - Obtiene el valor actual del rating
   */
  getValue(): number {
    return this._value;
  }

  /**
   * isDisabled() - Verifica si el componente está deshabilitado
   */
  isDisabled(): boolean {
    return this._disabled;
  }

  /**
   * onStarClick(rating: number)
   * ---------------------------
   * Se ejecuta cuando el usuario hace clic en una estrella.
   * 
   * Proceso:
   * 1. Actualizamos el valor interno
   * 2. Llamamos a onChange() para notificar a Angular Forms
   * 3. Llamamos a onTouched() para marcar como "touched"
   */
  onStarClick(rating: number): void {
    if (this._disabled) return;
    
    this._value = rating;
    this.onChange(rating); // ← Notifica a Angular Forms del cambio
    this.onTouched();      // ← Marca el componente como "touched"
  }

  /**
   * onStarHover(rating: number)
   * ----------------------------
   * Se ejecuta cuando el usuario pasa el mouse sobre una estrella.
   * Solo actualiza el preview visual, NO cambia el valor real.
   */
  onStarHover(rating: number): void {
    if (this._disabled) return;
    this.hoverRating.set(rating);
  }

  /**
   * onMouseLeave()
   * --------------
   * Se ejecuta cuando el usuario quita el mouse del componente.
   * Resetea el preview visual.
   */
  onMouseLeave(): void {
    this.hoverRating.set(0);
  }

  /**
   * isStarFilled(star: number): boolean
   * ------------------------------------
   * Determina si una estrella debe mostrarse llena o vacía.
   * 
   * Prioridad:
   * 1. Si hay hover, usa el hoverRating (preview)
   * 2. Si no hay hover, usa el valor actual (_value)
   */
  isStarFilled(star: number): boolean {
    const displayRating = this.hoverRating() || this._value;
    return star <= displayRating;
  }
}

