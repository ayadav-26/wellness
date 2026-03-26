import { ApplicationConfig }         from '@angular/core';
import { provideRouter }              from '@angular/router';
import { provideAnimationsAsync }     from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MAT_DATE_LOCALE }            from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { routes }                    from './app.routes';
import { authInterceptor }           from './core/interceptors/auth.interceptor';
import { errorInterceptor }          from './core/interceptors/error.interceptor';
import { loadingInterceptor }        from './core/interceptors/loading.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])
    ),
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration:           4000,
        horizontalPosition: 'end',
        verticalPosition:   'bottom',
      }
    },
    { provide: MAT_DATE_LOCALE, useValue: 'en-IN' },
    provideCharts(withDefaultRegisterables()),
  ]
};
