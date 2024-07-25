import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxIndexedDBModule } from "ngx-indexed-db";

import { routes } from "./app.routes";
import { dbConfig } from "./db.config";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        importProvidersFrom(NgxIndexedDBModule.forRoot(dbConfig)),
    ],
};
