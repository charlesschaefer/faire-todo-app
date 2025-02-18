import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, isDevMode } from "@angular/core";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withDebugTracing, withRouterConfig } from "@angular/router";
import { TranslocoModule, provideTransloco } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from "primeng/config";
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { provideSwipeMenu } from 'ngx-swipe-menu';
import 'hammerjs';

 
import { environment } from '../environments/environment';
import { AppDb } from "./app.db";
import { DEBUG } from "./app.debug";
import { routes } from "./app.routes";
import { AppTheme } from "./app.theme";
import { SyncService } from './services/sync.service';
import { TranslocoHttpLoader } from './transloco-loader';
import { ɵBrowserAnimationBuilder } from '@angular/animations';

const debugTracing = [];
void (DEBUG ? debugTracing.push(withDebugTracing()) : null);

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, 
            withRouterConfig({
                onSameUrlNavigation: 'reload',
                urlUpdateStrategy: 'eager'
            }),
            ...debugTracing,
        ),
        provideHttpClient(withFetch()),
        {
            provide: 'SUPABASE_URL',
            useValue: environment.supabaseUrl
        },
        {
            provide: 'SUPABASE_KEY',
            useValue: environment.supabaseKey
        },
        {
            provide: 'AppDb',
            useClass: AppDb
        },
        {
            provide: 'DEBUG',
            useValue: DEBUG
        },
        MessageService,
        SyncService,
        importProvidersFrom(TranslocoModule), 
        // provideHttpClient(), 
        provideTransloco({
            config: { 
                availableLangs: ['en', 'pt-br'],
                defaultLang: 'en',
                fallbackLang: 'en',
                // Remove this option if your application doesn't support changing language in runtime.
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
                missingHandler: {
                    allowEmpty: true,
                    logMissingKey: true
                }
            },
            loader: TranslocoHttpLoader
        }),
        importProvidersFrom(BrowserModule),
        importProvidersFrom(HammerModule),
        provideSwipeMenu(),
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: AppTheme,
                options: {
                    darkModeSelector: '.dark-mode'
                }
            }
        })
    ],
};

