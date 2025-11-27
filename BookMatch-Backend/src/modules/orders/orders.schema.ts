import { z } from 'zod';

// Esquema para validar cada línea del pedido
const orderItemSchema = z.object({
  // Quitamos el objeto de dentro de number() para evitar conflictos de tipos
    catalogBookId: z.number()
        .int('El ID del libro debe ser un entero')
        .positive('El ID del libro debe ser positivo'),

    quantity: z.number()
        .int('La cantidad debe ser un entero')
        .positive('La cantidad debe ser al menos 1'),

    price: z.number()
        .nonnegative('El precio no puede ser negativo'),
});

// Esquema principal
export const createOrderSchema = z.object({
    totalAmount: z.number()
        .nonnegative('El total no puede ser negativo'),
    
    shippingAddress: z.string()
        .min(10, 'La dirección es demasiado corta (mínimo 10 caracteres)')
        .max(500, 'La dirección es demasiado larga'),

    items: z.array(orderItemSchema)
        .min(1, 'El pedido debe contener al menos un libro'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;