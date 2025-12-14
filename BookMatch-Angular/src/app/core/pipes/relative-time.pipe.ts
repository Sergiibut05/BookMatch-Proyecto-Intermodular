import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    // Convertir a Date si es string ISO
    const date = typeof value === 'string' ? new Date(value) : value;
    
    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    // Menos de 1 minuto
    if (diffInSeconds < 60) {
      return diffInSeconds <= 1 ? 'hace un momento' : `hace ${diffInSeconds} segundos`;
    }

    // Menos de 1 hora
    if (diffInMinutes < 60) {
      if (diffInMinutes === 1) {
        return 'hace 1 minuto';
      }
      return `hace ${diffInMinutes} minutos`;
    }

    // Menos de 24 horas
    if (diffInHours < 24) {
      if (diffInHours === 1) {
        return 'hace 1 hora';
      }
      return `hace ${diffInHours} horas`;
    }

    // Menos de 7 días
    if (diffInDays < 7) {
      if (diffInDays === 1) {
        return 'ayer';
      }
      return `hace ${diffInDays} días`;
    }

    // Menos de 4 semanas
    if (diffInWeeks < 4) {
      if (diffInWeeks === 1) {
        return 'hace 1 semana';
      }
      return `hace ${diffInWeeks} semanas`;
    }

    // Menos de 12 meses
    if (diffInMonths < 12) {
      if (diffInMonths === 1) {
        return 'hace 1 mes';
      }
      return `hace ${diffInMonths} meses`;
    }

    // Más de 1 año
    if (diffInYears === 1) {
      return 'hace 1 año';
    }
    return `hace ${diffInYears} años`;
  }
}

