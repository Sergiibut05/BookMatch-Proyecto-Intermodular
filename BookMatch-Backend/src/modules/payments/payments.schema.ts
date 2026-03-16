import { z } from 'zod';

// Schema para crear sesión de checkout (compra directa de un libro)
export const createCheckoutSessionSchema = z.object({
  bookId: z.number().int().positive('El ID del libro debe ser un entero positivo'),
  quantity: z.number().int().positive('La cantidad debe ser un entero positivo').default(1),
});

// Schema para crear sesión de checkout con carrito (preparado para futuro)
export const createCheckoutSessionCartSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.number().int().positive('El ID del libro debe ser un entero positivo'),
      quantity: z.number().int().positive('La cantidad debe ser un entero positivo').default(1),
    })
  ).min(1, 'Debe haber al menos un item en el carrito'),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type CreateCheckoutSessionCartInput = z.infer<typeof createCheckoutSessionCartSchema>;

