import { enableProdMode, ApplicationRef } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { filter, take } from 'rxjs/operators';

platformBrowserDynamic().bootstrapModule(AppModule).then(moduleRef => {
  const appRef = moduleRef.injector.get(ApplicationRef);
  appRef.isStable.pipe(filter(v => v), take(1)).subscribe(() => {
    document.getElementById('app-preloader')?.remove();
  });
});