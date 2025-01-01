import { TestBed } from '@angular/core/testing';
import { ServiceAbstract } from './service.abstract';
// import { MockInstance, MockService } from 'ng-mocks';
import { AuthService } from '../auth/auth.service';
import { DbService } from './db.service';

class MockDto {}

class Service extends ServiceAbstract<MockDto> {
    protected override storeName = 'mock';
    public override userUuid!: string | null;
    constructor(
        protected override authService: AuthService,
        protected dbService: DbService
    ) {
        super(authService);
        this.setTable();
    }
}


describe('ServiceAbstract', () => {
    // Helps to reset customizations after each test.
    // Alternatively, you can enable
    // automatic resetting in test.ts.
    /* MockInstance.scope();

    const authService = MockService(AuthService, {
        authenticatedUser: MockService(BehaviorSubject<User | null>, {
            subscribe: (fn: (user: any) => any) => {
                fn({id: 'uuidteste'});
                return MockService(Subscription);
            }
        })
    });

    const dbService = MockService(DbService, {
        getTable: (name) => {
            return {} as Table;
        }
    });
 */

    let service: Service;

    beforeEach(() => {
        service = TestBed.inject(Service);
    });

    it('should store user after construction', () => {
        expect(service.userUuid).toEqual('uuidteste');
    });
}); 