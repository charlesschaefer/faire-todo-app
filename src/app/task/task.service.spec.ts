import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { ActivatedRoute } from '@angular/router';

import { TaskDto, TaskTree } from '../dto/task-dto';
import { Collection, PromiseExtended, Table, WhereClause } from 'dexie';
import { DbService } from '../services/db.service';
import { AuthService } from '../auth/auth.service';
import { DEBUG } from '../app.debug';

describe('TaskService', () => {
    let service: TaskService;

    const mockTask: TaskDto = {
        id: 1,
        uuid: 'a7150757-9a29-4b11-bfa9-b268ba9c43a8',
        user_uuid: 'a7150757-9a29-4b11-bfa9-b268ba9c43a8',
        title: 'Test Task',
        description: null,
        dueDate: null,
        dueTime: null,
        project: null,
        project_uuid: null,
        completed: 0,
        order: 1,
        parent: null,
        parent_uuid: null,
        recurring: null,
        updated_at: new Date(),
    };

    const mockSubtask: TaskDto = {
        id: 2,
        uuid: '14687f60-5531-4210-aa11-88cd0b53c91a',
        user_uuid: 'a7150757-9a29-4b11-bfa9-b268ba9c43a8',
        title: 'Test Subtask',
        description: null,
        dueDate: null,
        dueTime: null,
        project: null,
        project_uuid: null,
        completed: 0,
        order: 1,
        parent: 1,
        parent_uuid: 'a7150757-9a29-4b11-bfa9-b268ba9c43a8',
        recurring: null,
        updated_at: new Date(),
    };

    const fakeTaskTable1: Pick<Table<any, any, any>, 'add'> = {
        add: (_data: any, _key?: any) => {
            console.log("Chamou o table.add() mockado...")
            return (new Promise((resolve, _reject) => {
                console.log("Estamos resolvendo a promise do table.add() mockado")
                return resolve('');
            })) as PromiseExtended;
        }
    };
    const fakeTaskTable2: Pick<Table<any, any, any>, 'where'> = {
        where (_criteria: any) {
            return {} as unknown as WhereClause<any, any, any> & Collection<any, any, any>;
        },
    };

    it('should add task tree', (done) => {
        const fakeDbService = jasmine.createSpyObj<DbService>('DbService', {
            getTable: fakeTaskTable1 as Table<any, any, any>
        });
        TestBed.configureTestingModule({
            providers: [
                TaskService, {
                    provide: DbService,
                    useValue: fakeDbService
                },
                AuthService,
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '24fkzrw3487943uf358lovd' } } } },
                { provide: 'DEBUG', useValue: DEBUG }
            ],
        });
        service = TestBed.inject(TaskService);

        const mockTaskTree = { ...mockTask, children: [mockSubtask] } as TaskTree;

        spyOn(fakeDbService.getTable(''), 'add').and.resolveTo('');

        service.addTaskTree(mockTaskTree).subscribe({
            next: () => {
                const { children, ...task1 } = { ...mockTaskTree };
                expect(fakeTaskTable1.add).toHaveBeenCalledWith(task1);

                expect(fakeTaskTable1.add).toHaveBeenCalledWith(children[0]);

                done();
            },
            error: () => {
                fail('Expected the addTaskTree to succeed');
                done();
            }
        });
    });

    it('should get task tree', (done) => {
        const fakeDbService = jasmine.createSpyObj<DbService>('DbService', {
            getTable: fakeTaskTable2 as Table<any, any, any>
        });
        TestBed.configureTestingModule({
            providers: [
                TaskService, {
                    provide: DbService,
                    useValue: fakeDbService
                },
                AuthService,
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '24fkzrw3487943uf358lovd' } } } },
                { provide: 'DEBUG', useValue: DEBUG }
            ],
        });
        service = TestBed.inject(TaskService);

        let firstCall = true;
        let _calls = 0;
        spyOn(fakeDbService.getTable(''), 'where').and.returnValue({
            toArray: () => {
                _calls++;
                let returnTask = undefined;
                if (firstCall) {
                    firstCall = false;
                    returnTask = mockSubtask;
                }
                return new Promise((resolve, _reject) => {
                    return resolve(returnTask ? [returnTask] : []);
                });
            }} as Collection<any, any, any>
        );
        
        service.getTaskTree(mockTask).subscribe((taskTree: TaskTree) => {
            expect(taskTree).toBeDefined();
            expect(taskTree.children.length).toBe(1);
            expect(taskTree.children[0].uuid).toBe('14687f60-5531-4210-aa11-88cd0b53c91a');
            done();
        });
    });

    
});
