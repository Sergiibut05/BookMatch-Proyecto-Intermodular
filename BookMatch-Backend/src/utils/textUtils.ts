/**
 * Normaliza un texto quitando tildes y convirtiendo a minúsculas
 * para hacer búsquedas más flexibles
 * 
 * @param text - Texto a normalizar
 * @returns Texto normalizado sin tildes y en minúsculas
 * 
 * @example
 * normalizeText('Ciencia') // 'ciencia'
 * normalizeText('José') // 'jose'
 * normalizeText('Niño') // 'nino'
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres con tildes (á -> a + ´)
    .replace(/[\u0300-\u036f]/g, ''); // Elimina los diacríticos (tildes)
}

