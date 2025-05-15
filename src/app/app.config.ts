import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, Injectable, isDevMode } from "@angular/core";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withDebugTracing, withRouterConfig } from "@angular/router";
import { TranslocoModule, provideTransloco } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from "primeng/config";
import { HAMMER_GESTURE_CONFIG, HammerGestureConfig, BrowserModule, HammerModule } from '@angular/platform-browser';
import { provideSwipeMenu, SwipeMenuConfig } from 'ngx-swipe-menu';
import 'hammerjs';

import { environment } from '../environments/environment';
import { AppDb } from "./db/app.db";
import { DEBUG } from "./app.debug";
import { routes } from "./app.routes";
import { AppTheme } from "./app.theme";
import { SyncService } from './db/sync.service';
import { TranslocoHttpLoader } from './transloco-loader';

const debugTracing = [];
void (DEBUG ? debugTracing.push(withDebugTracing()) : null);

export type TranslocoAvailableLangs = 'en' | 'pt-br' | 'es';
export const AVAILABLE_LANGS = ['en', 'pt-br', 'es'] as TranslocoAvailableLangs[];
export const AVAILABLE_LANGS_LABELS = {'en': 'English', 'pt-br': 'Portuguese', 'es': 'Spanish'};

class SwipeOverride extends SwipeMenuConfig {
    override overrides = {
        "swipe": { enabled: true },
        "pan": { enabled: true },
        "pinch": { enabled: true },
        "rotate": { enabled: true }
    }

    constructor() {
        super();
        console.log('SwipeOverride', );
    }
}

const swipeProvider = provideSwipeMenu();
const swipeMenuProvidersFixed = {
    provide: swipeProvider.provide,
    useFactory: () => {
        const swipe = new SwipeOverride();
        swipe.overrides.swipe.enabled = true;
        return swipe;
    }
}

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
        provideTransloco({
            config: { 
                availableLangs: AVAILABLE_LANGS,
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
        swipeMenuProvidersFixed,
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

