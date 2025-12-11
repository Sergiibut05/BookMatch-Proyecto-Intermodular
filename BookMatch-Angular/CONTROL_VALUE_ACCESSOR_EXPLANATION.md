# 📚 Explicación: ControlValueAccessor

## ¿Qué es ControlValueAccessor?

`ControlValueAccessor` es una **interfaz de Angular** que permite que un componente personalizado funcione como un campo de formulario nativo (como `<input>`, `<select>`, etc.).

### Analogía Simple

Imagina que Angular Forms es un **traductor universal**:
- Los campos nativos (`<input>`, `<select>`) ya "hablan el idioma" de Angular Forms
- Tu componente personalizado necesita un "traductor" para comunicarse con Angular Forms
- **ControlValueAccessor ES ese traductor**

---

## ¿Por qué es útil?

### ❌ Sin ControlValueAccessor:
```typescript
// Tienes que manejar manualmente el valor
newReviewRating = signal<number>(0);

setRating(stars: number) {
  this.newReviewRating.set(stars);
}

// Y validar manualmente
submitReview() {
  if (this.newReviewRating() === 0) {
    alert('Selecciona un rating');
    return;
  }
  // ...
}
```

### ✅ Con ControlValueAccessor:
```html
<!-- Simplemente lo usas como un campo nativo -->
<app-star-rating formControlName="rating"></app-star-rating>
```

```typescript
// Angular Forms maneja todo automáticamente
this.reviewForm = this.fb.group({
  rating: [0, [Validators.required, Validators.min(1)]]
});

submitReview() {
  if (this.reviewForm.invalid) {
    // Angular ya sabe qué campos son inválidos
    return;
  }
  // ...
}
```

---

## ¿Cómo funciona? Los 4 métodos clave

Angular Forms necesita **4 métodos** para comunicarse con tu componente:

### 1. `writeValue(value: any)` - "Aquí está el valor inicial"

**Cuándo se llama:**
- Cuando Angular inicializa el formulario con un valor
- Cuando usas `formControl.setValue(5)` desde el código
- Cuando el valor del FormControl cambia desde fuera del componente

**Tu trabajo:**
```typescript
writeValue(value: number): void {
  this._value = value || 0; // Actualiza el valor interno
}
```

**Ejemplo:**
```typescript
// En el componente padre
this.reviewForm.patchValue({ rating: 4 });
// → Angular llama writeValue(4) en tu componente
```

---

### 2. `registerOnChange(fn: Function)` - "Notifícame cuando cambies"

**Cuándo se llama:**
- Una vez al inicializar el componente
- Angular te pasa una función que DEBES guardar

**Tu trabajo:**
```typescript
private onChange = (value: number) => {};

registerOnChange(fn: (value: number) => void): void {
  this.onChange = fn; // Guarda la función
}
```

**Cuándo la usas:**
```typescript
onStarClick(rating: number): void {
  this._value = rating;
  this.onChange(rating); // ← Notifica a Angular: "El valor cambió a 5"
}
```

**¿Qué pasa cuando llamas `onChange(5)`?**
- Angular actualiza el FormControl automáticamente
- Se ejecutan las validaciones
- El formulario sabe que el campo cambió

---

### 3. `registerOnTouched(fn: Function)` - "Avísame cuando el usuario toque"

**Cuándo se llama:**
- Una vez al inicializar el componente
- Angular te pasa una función que DEBES guardar

**Tu trabajo:**
```typescript
private onTouched = () => {};

registerOnTouched(fn: () => void): void {
  this.onTouched = fn; // Guarda la función
}
```

**Cuándo la usas:**
```typescript
onStarClick(rating: number): void {
  this._value = rating;
  this.onChange(rating);
  this.onTouched(); // ← Notifica a Angular: "El usuario interactuó"
}
```

**¿Por qué es importante?**
- Marca el campo como "touched" (tocado)
- Permite mostrar errores solo después de que el usuario interactúe
- Mejora la UX (no muestra errores antes de tiempo)

---

### 4. `setDisabledState(isDisabled: boolean)` - "Deshabilita/habilita"

**Cuándo se llama:**
- Cuando el FormControl se deshabilita: `formControl.disable()`
- Cuando el FormControl se habilita: `formControl.enable()`

**Tu trabajo:**
```typescript
private _disabled = false;

setDisabledState(isDisabled: boolean): void {
  this._disabled = isDisabled;
  // Deshabilita la interacción del usuario
}
```

**Ejemplo:**
```typescript
// En el componente padre
this.reviewForm.get('rating')?.disable();
// → Angular llama setDisabledState(true) en tu componente
```

---

## Flujo completo: Ejemplo paso a paso

### Escenario: Usuario hace clic en la estrella 4

```
1. Usuario hace clic en estrella 4
   ↓
2. onStarClick(4) se ejecuta
   ↓
3. this._value = 4 (actualiza valor interno)
   ↓
4. this.onChange(4) (notifica a Angular)
   ↓
5. Angular actualiza el FormControl: rating = 4
   ↓
6. Angular ejecuta validaciones
   ↓
7. this.onTouched() (marca como touched)
   ↓
8. Angular actualiza el estado del formulario
   (valid, invalid, touched, dirty, etc.)
```

---

## El Provider: NG_VALUE_ACCESSOR

Para que Angular sepa que tu componente implementa ControlValueAccessor, necesitas registrarlo:

```typescript
@Component({
  // ...
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StarRatingComponent),
      multi: true // ← Importante: permite múltiples providers
    }
  ]
})
```

**¿Qué hace esto?**
- Le dice a Angular: "Este componente puede funcionar como un control de formulario"
- `multi: true` permite que otros componentes también implementen ControlValueAccessor

---

## Ventajas de usar ControlValueAccessor

### ✅ 1. Integración perfecta con formularios reactivos
```html
<app-star-rating formControlName="rating"></app-star-rating>
```

### ✅ 2. Validación automática
```typescript
rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]]
```

### ✅ 3. Estado del formulario automático
```typescript
this.reviewForm.get('rating')?.touched  // true después de interactuar
this.reviewForm.get('rating')?.dirty     // true después de cambiar valor
this.reviewForm.get('rating')?.valid    // true si pasa validaciones
```

### ✅ 4. Reutilizable
```html
<!-- Puedes usarlo en cualquier formulario -->
<app-star-rating formControlName="rating"></app-star-rating>
```

### ✅ 5. Accesibilidad
- Funciona con lectores de pantalla
- Soporta navegación por teclado
- Compatible con herramientas de testing

---

## Comparación: Antes vs Después

### Antes (Sin ControlValueAccessor)
```typescript
// Componente padre
newReviewRating = signal<number>(0);
newReviewComment = signal<string>('');

setRating(stars: number) {
  this.newReviewRating.set(stars);
}

submitReview() {
  if (this.newReviewRating() === 0) {
    alert('Selecciona rating');
    return;
  }
  // ...
}
```

```html
<!-- HTML -->
<div (click)="setRating(star)">...</div>
<textarea [(ngModel)]="newReviewComment"></textarea>
<button [disabled]="newReviewRating() === 0">Enviar</button>
```

### Después (Con ControlValueAccessor)
```typescript
// Componente padre
reviewForm = this.fb.group({
  rating: [0, [Validators.required, Validators.min(1)]],
  comment: ['']
});

submitReview() {
  if (this.reviewForm.invalid) {
    this.reviewForm.markAllAsTouched();
    return;
  }
  // ...
}
```

```html
<!-- HTML -->
<form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
  <app-star-rating formControlName="rating"></app-star-rating>
  <textarea formControlName="comment"></textarea>
  <button [disabled]="reviewForm.invalid">Enviar</button>
</form>
```

---

## Resumen

**ControlValueAccessor** es como un "puente" entre tu componente personalizado y Angular Forms:

1. **writeValue()** - Angular te dice el valor inicial
2. **registerOnChange()** - Angular te da una función para notificar cambios
3. **registerOnTouched()** - Angular te da una función para notificar interacción
4. **setDisabledState()** - Angular te dice si debes deshabilitar el componente

Implementando estos 4 métodos, tu componente se convierte en un "ciudadano de primera clase" del ecosistema de formularios de Angular, igual que `<input>` o `<select>`.

---

## Recursos adicionales

- [Angular Docs: ControlValueAccessor](https://angular.io/api/forms/ControlValueAccessor)
- [Angular Forms Guide](https://angular.io/guide/forms-overview)
- [Custom Form Controls](https://angular.io/guide/form-controls)

