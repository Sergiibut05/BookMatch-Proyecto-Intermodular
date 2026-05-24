import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { disableConsoleInProduction } from './app/core/utils/disable-console-in-production';

disableConsoleInProduction();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
