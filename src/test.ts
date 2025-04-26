// import { ngMocks } from 'ng-mocks';
/* import { EMPTY } from "rxjs";
import { AuthService } from "./app/auth/auth.service"; */


// All methods in mock declarations and providers
// will be automatically spied on their creation.
// https://ng-mocks.sudo.eu/extra/auto-spy
// ngMocks.autoSpy('jasmine'); // or jest

// ngMocks.defaultMock helps to customize mocks
// globally. Therefore, we can avoid copy-pasting
// among tests.
// https://ng-mocks.sudo.eu/api/ngMocks/defaultMock
/* ngMocks.defaultMock(AuthService, () => ({
  userSubject: EMPTY,
  user: EMPTY,
})); */

// This file is required by karma.conf.js and loads recursively all the .spec and framework files
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
// In Angular 19+, initTestEnvironment is deprecated,
// but we need to keep it for backwards compatibility
try {
  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch (e) {
  // Already initialized
}

