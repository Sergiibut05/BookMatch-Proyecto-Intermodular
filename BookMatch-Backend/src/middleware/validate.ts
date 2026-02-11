import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      message: 'Datos inválidos. Verifica que el título tenga entre 3 y 100 caracteres.',
      errors: parsed.error.flatten() 
    });
  }
  
  // Si el schema tiene una propiedad 'body', extraerla; de lo contrario, usar el resultado completo
  if (parsed.data && typeof parsed.data === 'object' && 'body' in parsed.data) {
    req.body = parsed.data.body;
  } else {
    req.body = parsed.data;
  }
  
  next();
};




// Este sería un middleware para procesar los errores de express-validator
export const validateResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};