import { APP_INITIALIZER, ErrorHandler, Injector, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { StorageService } from './storage.service';
import { Router, RouterModule } from '@angular/router';
import { AppComponent } from './ui/layout/app.component';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StaticInjector } from '../util/lifecycle/static-injector';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { Title } from '@angular/platform-browser';
import { UiModule } from './ui/ui.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GlobalErrorHandler } from './global-error-handler';

@NgModule({
  declarations: [],
  imports: [
    UiModule,
    HttpClientModule,
    RouterModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    FontAwesomeModule,
    MatNativeDateModule,
    BrowserAnimationsModule,
  ],
  providers: [
    StorageService,
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  public constructor(
    private readonly injector: Injector,
    private readonly titleService: Title
  ) {
    StaticInjector.init(injector);

    this.titleService.setTitle('Algovis');
  }
}
