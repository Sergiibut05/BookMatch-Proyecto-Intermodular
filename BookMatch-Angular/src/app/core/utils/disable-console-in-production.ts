import { environment } from '../../../environments/environment';

/** Silencia logs de depuración en builds de producción. */
export function disableConsoleInProduction(): void {
  if (!environment.production) return;

  const noop = (): void => undefined;
  console.log = noop;
  console.debug = noop;
  console.info = noop;
}
