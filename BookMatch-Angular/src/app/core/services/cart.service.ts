import { Injectable, signal, computed, effect } from '@angular/core';
import { CatalogBook } from '@shared/models';

export interface CartItem {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'bookmatch_cart';
  private readonly isBrowser = typeof window !== 'undefined';

  // Signal privado para los items del carrito
  private cartItemsSignal = signal<CartItem[]>(this.loadFromStorage());

  // Signal público de solo lectura para los items
  readonly cartItems = this.cartItemsSignal.asReadonly();

  // Computed signal para el precio total
  readonly totalPrice = computed(() =>
    this.cartItemsSignal().reduce((total, item) => total + item.price * item.quantity, 0)
  );

  // Computed signal para el total de items
  readonly totalItems = computed(() =>
    this.cartItemsSignal().reduce((total, item) => total + item.quantity, 0)
  );

  constructor() {
    effect(() => {
      const items = this.cartItemsSignal();
      if (this.isBrowser) {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
          // Error silencioso al guardar en localStorage
        }
      }
    });
  }

  /**
   * @param book Libro a añadir
   * @param quantity Cantidad a añadir
   */
  addToCart(book: CatalogBook, quantity: number = 1): void {
    const currentItems = this.cartItemsSignal();
    const existingItemIndex = currentItems.findIndex(item => item.id === book.id);

    if (existingItemIndex >= 0) {
      // Si el libro ya está en el carrito, incrementar la cantidad
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity
      };
      this.cartItemsSignal.set(updatedItems);
    } else {
      // Si no existe, añadirlo al carrito
      const newItem: CartItem = {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: quantity,
        coverUrl: book.coverUrl
      };
      this.cartItemsSignal.set([...currentItems, newItem]);
    }
  }

  /**
   * @param bookId ID del libro a eliminar
   */
  removeFromCart(bookId: number): void {
    const currentItems = this.cartItemsSignal();
    const updatedItems = currentItems.filter(item => item.id !== bookId);
    this.cartItemsSignal.set(updatedItems);
  }

  /**
   * Limpia todo el carrito
   */
  clearCart(): void {
    this.cartItemsSignal.set([]);
  }

  /**
   * @param bookId ID del libro
   * @param quantity Nueva cantidad
   */
  updateQuantity(bookId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(bookId);
      return;
    }

    const currentItems = this.cartItemsSignal();
    const updatedItems = currentItems.map(item =>
      item.id === bookId ? { ...item, quantity } : item
    );
    this.cartItemsSignal.set(updatedItems);
  }

  /**
   * @returns Array de items formateados para checkout
   */
  getItemsForCheckout(): Array<{ bookId: number; quantity: number }> {
    return this.cartItemsSignal().map(item => ({
      bookId: item.id,
      quantity: item.quantity
    }));
  }

  /**
   * Carga el carrito desde localStorage
   */
  private loadFromStorage(): CartItem[] {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        // Validar que sea un array válido
        if (Array.isArray(items)) {
          return items;
        }
      }
    } catch (error) {
      // Error silencioso al cargar desde localStorage
    }

    return [];
  }
}
