import { Injectable, signal } from '@angular/core';
import { DateTime } from 'luxon';
import { CalendarEvent, CalendarProject, CalendarRecurrenceType } from 'ngx-calendar-view';
import { Observable, from, map, of, switchMap } from 'rxjs';

import { CALENDAR_CONFIG } from '../calendar.config';
import { ProjectDto } from '../dto/project-dto';
import { TaskDto } from '../dto/task-dto';
import { ProjectService } from '../project/project.service';
import { TaskService } from '../task/task.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {

  private projects = signal<ProjectDto[]>([]);

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService
  ) {
    this.projectService.list().then(projects => this.projects.set(projects as ProjectDto[]));
  }

  /**
   * Get all tasks for calendar view (incomplete tasks with dates only)
   * This method loads ALL tasks regardless of the current view context
   */
  getAllTasksForCalendar(): Observable<CalendarEvent[]> {
    return this.taskService.getAllTasks().pipe(
      map(tasks => this.convertTasksToCalendarEvents(tasks))
    );
  }

  /**
   * Get all projects for calendar view
   */
  getAllProjectsForCalendar(): Observable<CalendarProject[]> {
    return of(this.convertProjectsToCalendarProjects(this.projects()));
  }

  /**
   * Convert TaskDto to CalendarEvent
   */
  private convertTasksToCalendarEvents(tasks: TaskDto[]): CalendarEvent[] {
    return tasks
      .filter(task => !task.completed && task.dueDate) // Only incomplete tasks with dates
      .map(task => {
          const eventDate = DateTime.fromJSDate(task.dueDate!);
        const calendarEvent: CalendarEvent = {
          id: task.uuid,
          title: task.title,
          description: task.description || undefined,
          date: eventDate,
          duration: CALENDAR_CONFIG.defaultDuration,
          project: this.getProjectName(task),
          recurrenceType: this.mapRecurrenceType(task.recurring)
        };

        // Set time if available, otherwise it's an all-day event
        if (task.dueTime) {
            const eventTime = DateTime.fromJSDate(task.dueTime);
          calendarEvent.time = eventTime.set({
            year: eventDate.year,
            month: eventDate.month,
            day: eventDate.day,
          });
        }

        return calendarEvent;
      });
  }

  /**
   * Convert ProjectDto to CalendarProject
   */
  private convertProjectsToCalendarProjects(projects: ProjectDto[]): CalendarProject[] {
    return projects.map(project => ({
      title: project.name,
      color: undefined // Let calendar component assign random colors
    }));
  }

  /**
   * Get project name for a task (project name or 'Inbox')
   */
  private getProjectName(task: TaskDto): string {
    // For now, return 'Inbox' for tasks without projects
    // In a more complete implementation, you would fetch the actual project name
    return task.project_uuid ? this.projects().find(project => project.uuid === task.project_uuid)?.name || 'Inbox' : 'Inbox';
  }

  /**
   * Map recurring type from TaskDto to CalendarEvent
   */
  private mapRecurrenceType(recurring: string | null): CalendarRecurrenceType | undefined {
    if (!recurring) return undefined;
    
    const mapping: Record<string, CalendarRecurrenceType> = {
      'daily': CalendarRecurrenceType.DAILY,
      'weekly': CalendarRecurrenceType.WEEKLY,
      'monthly': CalendarRecurrenceType.MONTHLY,
      'yearly': CalendarRecurrenceType.YEARLY,
      'weekday': CalendarRecurrenceType.WEEKDAY
    };
    
    return mapping[recurring];
  }

  /**
   * Update task date/time when moved in calendar
   */
  updateTaskDateTime(taskUuid: string, newDate: DateTime, newTime?: DateTime): Observable<any> {
    return from(this.taskService.getByField('uuid', taskUuid)).pipe(
      switchMap(tasks => {
        if (tasks.length === 0) {
          throw new Error('Task not found');
        }
        
        const task = tasks[0] as TaskDto;
        const updatedTask = {
          ...task,
          dueDate: newDate.toJSDate(),
          dueTime: newTime ? newTime.toJSDate() : null,
          updated_at: new Date()
        };
        
        return this.taskService.edit(taskUuid, updatedTask);
      })
    );
  }

  /**
   * Get project name by UUID for better project display
   */
  getProjectNameByUuid(projectUuid: string | null): Observable<string> {
    if (!projectUuid) {
      return of('Inbox');
    }
    
    return from(this.projectService.getByField('uuid', projectUuid)).pipe(
      map(projects => {
        if (projects.length > 0) {
          return (projects[0] as ProjectDto).name;
        }
        return 'Inbox';
      })
    );
  }
}
