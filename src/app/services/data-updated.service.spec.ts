import { TestBed } from '@angular/core/testing';

import { DataUpdatedService } from './data-updated.service';

describe('DataUpdatedService', () => {
    let service: DataUpdatedService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DataUpdatedService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
