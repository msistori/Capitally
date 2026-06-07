import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { removeAppPreloader } from './app/preloader';

platformBrowserDynamic().bootstrapModule(AppModule).then(() => {
  removeAppPreloader();
}).catch(error => {
  removeAppPreloader();
  console.error(error);
});
