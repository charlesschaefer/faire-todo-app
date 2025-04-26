import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Collection, PromiseExtended, Table, WhereClause } from 'dexie';
import { DatabaseChangeType } from 'dexie-observable/api';
import { DateTime } from 'luxon';
import { Observable, of, Subject } from 'rxjs';

import { DEBUG } from '../app.debug';
import { AuthService } from '../auth/auth.service';
import { RecurringType, TaskDto, TaskTree } from '../dto/task-dto';
import { DataUpdatedService } from '../services/data-updated.service';
import { DbService } from '../services/db.service';
import { TaskAttachmentService } from '../services/task-attachment.service';
import { TaskService } from './task.service';

describe('TaskService', () => {
    let service: TaskService;
    let mockDbService: jasmine.SpyObj<DbService>;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let mockDataUpdatedService: jasmine.SpyObj<DataUpdatedService>;
    let mockTaskAttachmentService: jasmine.SpyObj<TaskAttachmentService>;
    let mockTable: any;

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
        originalDueDate: null,
        priority: null
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
        originalDueDate: null,
        priority: null
    };

    const fakeTaskTable1: Pick<Table<any, any, any>, 'add'> = {
        add: (_data: any, _key?: any) => {
            return (new Promise((resolve, _reject) => {
                return resolve('');
            })) as PromiseExtended;
        }
    };
    const fakeTaskTable2: Pick<Table<any, any, any>, 'where'> = {
        where (_criteria: any) {
            return {} as unknown as WhereClause<any, any, any> & Collection<any, any, any>;
        },
    };

    beforeEach(() => {
        mockTable = {
            add: jasmine.createSpy('add').and.resolveTo('new-uuid'),
            where: jasmine.createSpy('where').and.returnValue({
                equals: jasmine.createSpy('equals').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        toArray: jasmine.createSpy('toArray').and.resolveTo([]),
                        count: jasmine.createSpy('count').and.resolveTo(0)
                    }),
                    toArray: jasmine.createSpy('toArray').and.resolveTo([]),
                    count: jasmine.createSpy('count').and.resolveTo(0)
                }),
                above: jasmine.createSpy('above').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        toArray: jasmine.createSpy('toArray').and.resolveTo([]),
                        count: jasmine.createSpy('count').and.resolveTo(0)
                    })
                }),
                belowOrEqual: jasmine.createSpy('belowOrEqual').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        toArray: jasmine.createSpy('toArray').and.resolveTo([]),
                        count: jasmine.createSpy('count').and.resolveTo(0)
                    })
                }),
                anyOf: jasmine.createSpy('anyOf').and.returnValue({
                    toArray: jasmine.createSpy('toArray').and.resolveTo([])
                }),
                toArray: jasmine.createSpy('toArray').and.resolveTo([]),
                count: jasmine.createSpy('count').and.resolveTo(0)
            }),
            and: jasmine.createSpy('and').and.returnValue({
                toArray: jasmine.createSpy('toArray').and.resolveTo([])
            }),
            edit: jasmine.createSpy('edit').and.resolveTo({}),
            update: jasmine.createSpy('update').and.resolveTo(1),
            bulkUpdate: jasmine.createSpy('bulkUpdate').and.resolveTo(1),
            delete: jasmine.createSpy('delete').and.resolveTo(),
            put: jasmine.createSpy('put').and.resolveTo('uuid'),
            toArray: jasmine.createSpy('toArray').and.resolveTo([])
        };

        mockDbService = jasmine.createSpyObj('DbService', ['getTable']);
        mockDbService.getTable.and.returnValue(mockTable);

        mockAuthService = jasmine.createSpyObj('AuthService', ['getUserUuid']);
        (mockAuthService as any).user = of({ id: 'user-uuid' });
        (mockAuthService as any).getUserUuid.and.returnValue('user-uuid');

        mockDataUpdatedService = jasmine.createSpyObj('DataUpdatedService', ['next']);

        mockTaskAttachmentService = jasmine.createSpyObj('TaskAttachmentService', ['getByField', 'edit']);
        mockTaskAttachmentService.getByField.and.resolveTo([]);

        TestBed.configureTestingModule({
            providers: [
                TaskService,
                { provide: DbService, useValue: mockDbService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: DataUpdatedService, useValue: mockDataUpdatedService },
                { provide: TaskAttachmentService, useValue: mockTaskAttachmentService },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '24fkzrw3487943uf358lovd' } } } },
                { provide: 'DEBUG', useValue: DEBUG }
            ],
        });
        
        service = TestBed.inject(TaskService);
        // Set the table property directly
        
        (service as any).userUuid = 'user-uuid';
        (service as any).storeName = 'task';
    });

    it('should add task tree', (done) => {
        const mockTaskTree = { ...mockTask, children: [mockSubtask] } as TaskTree;

        spyOn(service, 'add').and.returnValue(of('new-uuid'));

        service.addTaskTree(mockTaskTree).subscribe({
            next: () => {
                const { children, ...task1 } = { ...mockTaskTree };
                expect((service as any).table.add).toHaveBeenCalled();
                done();
            },
            error: () => {
                fail('Expected the addTaskTree to succeed');
                done();
            }
        });
    });

    it('should get task tree', (done) => {
        const subtasks = [mockSubtask];
        mockTable.where.and.returnValue({
            toArray: jasmine.createSpy('toArray').and.resolveTo(subtasks)
        });

        service.getTaskTree(mockTask).subscribe((taskTree: TaskTree) => {
            expect(taskTree).toBeDefined();
            expect(taskTree.children.length).toBe(1);
            done();
        });
    });

    // New tests start here

    describe('fillOriginalDueDate', () => {
        it('should set originalDueDate to null when dueDate is null', () => {
            const task = { ...mockTask, dueDate: null, originalDueDate: new Date() };
            const result = (service as any).fillOriginalDueDate(task);
            expect(result.originalDueDate).toBeNull();
        });

        it('should set originalDueDate to dueDate when originalDueDate is null', () => {
            const dueDate = new Date();
            const task = { ...mockTask, dueDate, originalDueDate: null };
            const result = (service as any).fillOriginalDueDate(task);
            expect(result.originalDueDate).toEqual(dueDate);
        });

        it('should not change originalDueDate when both dueDate and originalDueDate are set', () => {
            const dueDate = new Date();
            const originalDueDate = new Date(dueDate.getTime() - 86400000); // 1 day before
            const task = { ...mockTask, dueDate, originalDueDate };
            const result = (service as any).fillOriginalDueDate(task);
            expect(result.originalDueDate).toEqual(originalDueDate);
        });
    });

    describe('listParentTasks', () => {
        it('should return tasks with no parent', (done) => {
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                and: jasmine.createSpy('and').and.returnValue({
                    toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                })
            });

            service.listParentTasks().subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith({ completed: 0 });
                done();
            });
        });
    });

    describe('orderTasks', () => {
        it('should order tasks by priority and then by order', () => {
            const tasks = [
                { ...mockTask, priority: 'low' as 'low', order: 2 },
                { ...mockTask, priority: 'high' as 'high', order: 1 },
                { ...mockTask, priority: 'medium' as 'medium', order: 3 },
                { ...mockTask, priority: null, order: 4 }
            ];

            const result = service.orderTasks([...tasks] as TaskDto[]);
            expect(result[0].priority).toBe('high');
            expect(result[1].priority).toBe('medium');
            expect(result[2].priority).toBe('low');
            expect(result[3].priority).toBe(null);
        });

        it('should maintain order for tasks with same priority', () => {
            const tasks = [
                { ...mockTask, priority: 'medium' as 'medium', order: 3 },
                { ...mockTask, priority: 'medium' as 'medium', order: 1 },
                { ...mockTask, priority: 'medium' as 'medium', order: 2 }
            ];

            const result = service.orderTasks([...tasks] as TaskDto[]);
            expect(result[0].order).toBe(1);
            expect(result[1].order).toBe(2);
            expect(result[2].order).toBe(3);
        });
    });

    describe('getFromProject', () => {
        it('should get tasks from a specific project', (done) => {
            const projectUuid = 'project-123';
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                and: jasmine.createSpy('and').and.returnValue({
                    toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                })
            });

            service.getFromProject(projectUuid).subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith({ completed: 0 });
                done();
            });
        });
    });

    describe('getForToday', () => {
        it('should get tasks due today or earlier', (done) => {
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                belowOrEqual: jasmine.createSpy('belowOrEqual').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        and: jasmine.createSpy('and').and.returnValue({
                            toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                        })
                    })
                })
            });

            service.getForToday().subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith('dueDate');
                done();
            });
        });
    });

    describe('getUpcoming', () => {
        it('should get tasks with due dates after today', (done) => {
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                above: jasmine.createSpy('above').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                    })
                })
            });

            service.getUpcoming().subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith('dueDate');
                done();
            });
        });
    });

    describe('orderTasksByCompletion', () => {
        it('should order tasks by completion status', () => {
            const tasks = [
                { ...mockTask, completed: 1 },
                { ...mockTask, completed: 0 }
            ];

            const result = service.orderTasksByCompletion([...tasks]);
            expect(result[0].completed).toBe(0);
            expect(result[1].completed).toBe(1);
        });
    });

    describe('getTaskSubtasks', () => {
        it('should get subtasks for a given task', (done) => {
            const subtasks = [mockSubtask];
            mockTable.where.and.returnValue({
                equals: jasmine.createSpy('equals').and.returnValue({
                    and: jasmine.createSpy('and').and.returnValue({
                        toArray: jasmine.createSpy('toArray').and.resolveTo(subtasks)
                    })
                })
            });

            service.getTaskSubtasks(mockTask).subscribe(result => {
                expect(result).toEqual(subtasks);
                expect(mockTable.where).toHaveBeenCalledWith('parent_uuid');
                done();
            });
        });
    });

    describe('countSubtasksByCompletion', () => {
        it('should count subtasks by completion status', (done) => {
            mockTable.where.and.returnValue({
                count: jasmine.createSpy('count').and.resolveTo(5)
            });

            service.countSubtasksByCompletion(mockTask).subscribe(result => {
                expect(result).toEqual({ subtasks: 5, completed: 5 });
                done();
            });
        });
    });

    describe('getProjectTasks', () => {
        it('should get tasks for a specific project', (done) => {
            const projectUuid = 'project-123';
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                and: jasmine.createSpy('and').and.returnValue({
                    toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                })
            });

            service.getProjectTasks(projectUuid).subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith({
                    project_uuid: projectUuid,
                    completed: 0
                });
                done();
            });
        });
    });

    describe('getAllTasks', () => {
        it('should get all parent tasks that are not completed', (done) => {
            const tasks = [mockTask];
            mockTable.where.and.returnValue({
                and: jasmine.createSpy('and').and.returnValue({
                    toArray: jasmine.createSpy('toArray').and.resolveTo(tasks)
                })
            });

            service.getAllTasks().subscribe(result => {
                expect(result).toEqual(tasks);
                expect(mockTable.where).toHaveBeenCalledWith({ completed: 0 });
                done();
            });
        });
    });

    describe('removeTaskTree', () => {
        it('should remove a task and its subtasks', (done) => {
            spyOn(service, 'remove').and.returnValue(of(1));
            spyOn(service, 'getTaskSubtasks').and.returnValue(of([mockSubtask]));
            spyOn(service, 'removeTaskTree').and.callThrough();

            service.removeTaskTree(mockTask).subscribe({
                complete: () => {
                    expect(service.remove).toHaveBeenCalledWith(mockTask.uuid);
                    expect(service.getTaskSubtasks).toHaveBeenCalledWith(mockTask);
                    expect(service.removeTaskTree).toHaveBeenCalledWith(mockSubtask);
                    done();
                }
            });
        });
    });

    describe('markTaskComplete', () => {
        it('should mark a task as complete', (done) => {
            spyOn(service, 'edit').and.returnValue(of(1));
            const task = { ...mockTask, completed: 0 };

            service.markTaskComplete(task).subscribe({
                complete: () => {
                    expect(service.edit).toHaveBeenCalled();
                    expect(task.completed).toBe(1);
                    expect(mockDataUpdatedService.next).toHaveBeenCalled();
                    done();
                }
            });
        });

        it('should create a new recurring task when marking a recurring task complete', (done) => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const recurringTask = { 
                ...mockTask, 
                completed: 0, 
                recurring: RecurringType.DAILY,
                dueDate: today,
                originalDueDate: today
            };

            spyOn(service, 'edit').and.returnValue(of(1));
            mockTable.add.and.resolveTo('new-task-uuid');

            // Setup to handle recursive calls - mimic table behavior
            mockTaskAttachmentService.getByField.and.resolveTo([]);
            spyOn(service, 'getByField').and.resolveTo([]);
            
            service.markTaskComplete(recurringTask).subscribe({
                next: (newTask: any) => {
                    const aNewTask = newTask as TaskDto;
                    service.getByField("uuid", recurringTask.uuid).then(tasks => {
                        const oldTask = tasks[0];
                        expect(oldTask.completed).toBe(1);
                    })
                    expect(newTask).toBeDefined();
                    expect(mockTable.add).toHaveBeenCalled();
                    expect(aNewTask.completed).toBe(0);
                    done();
                }
            });
        });
    });

    describe('undoMarkTaskComplete', () => {
        it('should undo marking a task as complete', (done) => {
            spyOn(service, 'edit').and.returnValue(of(1));
            const task = { ...mockTask, completed: 1 };

            service.undoMarkTaskComplete(task).subscribe({
                complete: () => {
                    expect(service.edit).toHaveBeenCalled();
                    expect(task.completed).toBe(0);
                    expect(mockDataUpdatedService.next).toHaveBeenCalled();
                    done();
                }
            });
        });

        it('should remove the newly created task when undoing a recurring task completion', (done) => {
            const task = { ...mockTask, completed: 1 };
            const newTask = { ...mockTask, uuid: 'new-task-uuid', completed: 0 };
            
            spyOn(service, 'edit').and.returnValue(of(1));
            spyOn(service, 'remove').and.returnValue(of(1));
            
            service.undoMarkTaskComplete(task, newTask).subscribe({
                complete: () => {
                    expect(service.edit).toHaveBeenCalled();
                    expect(service.remove).toHaveBeenCalledWith(newTask.uuid);
                    expect(task.completed).toBe(0);
                    done();
                }
            });
        });
    });

    describe('separateDueTasks', () => {
        it('should separate due tasks from other tasks', () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const dueTask = { ...mockTask, dueDate: yesterday };
            const upcomingTask = { ...mockTask, dueDate: tomorrow };
            const tasks = [dueTask, upcomingTask];

            spyOn(service, 'isTaskDue').and.callFake((task) => {
                return (task?.dueDate && task?.dueDate < today) as boolean;
            });

            const result = service.separateDueTasks([...tasks]);
            expect(result.dueTasks.length).toBe(1);
            expect(result.otherTasks.length).toBe(1);
            expect(result.dueTasks[0]).toEqual(dueTask);
            expect(result.otherTasks[0]).toEqual(upcomingTask);
        });
    });

    describe('isTaskDue', () => {
        it('should return false for tasks with no due date', () => {
            const task = { ...mockTask, dueDate: null };
            expect(service.isTaskDue(task)).toBe(false);
        });

        it('should return false for tasks with future due dates', () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const task = { ...mockTask, dueDate: tomorrow };
            expect(service.isTaskDue(task)).toBe(false);
        });

        it('should return true for tasks with past due dates', () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const task = { ...mockTask, dueDate: yesterday };
            expect(service.isTaskDue(task)).toBe(true);
        });

        it('should check due time if provided', () => {
            const now = new Date();
            const dueDate = new Date(now);
            const dueTimePast = new Date(now);
            dueTimePast.setHours(now.getHours() - 1);

            const task = { 
                ...mockTask, 
                dueDate: dueDate,
                dueTime: dueTimePast
            };
            
            expect(service.isTaskDue(task)).toBe(true);
        });
    });

    describe('rescheduleTasksForToday', () => {
        it('should reschedule tasks for today', (done) => {
            const tasks = [mockTask, mockSubtask];
            const today = new Date();
            today.setHours(0);
            today.setMinutes(0);
            today.setSeconds(0);
            today.setMilliseconds(0);
            
            // Setup the mock to resolve immediately
            mockTable.bulkUpdate.and.returnValue(Promise.resolve(2));
            
            // First check expectations on the calls
            service.rescheduleTasksForToday(tasks);
            
            expect(mockTable.bulkUpdate).toHaveBeenCalled();
            const updateCall = mockTable.bulkUpdate.calls.first().args[0];
            expect(updateCall.length).toBe(2);
            expect(updateCall[0].key).toBe(mockTask.uuid);
            expect(updateCall[1].key).toBe(mockSubtask.uuid);
            
            // Use setTimeout to check after the promise resolves
            setTimeout(() => {
                expect(mockDataUpdatedService.next).toHaveBeenCalled();
                const dataUpdateArgs = mockDataUpdatedService.next.calls.first().args[0];
                expect(dataUpdateArgs[0].type).toBe(DatabaseChangeType.Update);
                expect(dataUpdateArgs[0].table).toBe('task');
                done();
            }, 0);
        });
    });

    describe('countAttachmentsForTasks', () => {
        it('should count attachments for tasks', (done) => {
            const tasks = [mockTask, mockSubtask];
            const attachments = [
                { task_uuid: mockTask.uuid, uuid: 'attachment-1' },
                { task_uuid: mockTask.uuid, uuid: 'attachment-2' },
                { task_uuid: mockSubtask.uuid, uuid: 'attachment-3' }
            ];
            
            mockDbService.getTable.and.callFake((tableName) => {
                if (tableName === "task_attachment") {
                    return {
                        where: jasmine.createSpy('where').and.returnValue({
                            anyOf: jasmine.createSpy('anyOf').and.returnValue({
                                toArray: jasmine.createSpy('toArray').and.resolveTo(attachments)
                            })
                        })
                    };
                }
                return mockTable;
            });

            service.countAttachmentsForTasks(tasks).subscribe(result => {
                expect(result.get(mockTask.uuid)).toBe(2);
                expect(result.get(mockSubtask.uuid)).toBe(1);
                done();
            });
        });
    });
});
