import { Routes } from "@angular/router";

import { TodayComponent } from "./today/today.component";
import { InboxComponent } from "./inbox/inbox.component";
import { UpcomingComponent } from "./upcoming/upcoming.component";
import { ProjectComponent } from "./project/project.component";
import { ProjectTasksComponent } from "./project/project-tasks/project-tasks.component";
import { SearchComponent } from "./search/search.component";
import { SettingsComponent } from "./settings/settings.component";
import { AllTasksComponent } from "./all-tasks/all-tasks.component";
import { SynchronizationComponent } from "./synchronization/synchronization.component";
import { InboxResolver } from "./inbox/inbox.resolver";

export const routes: Routes = [
    {path: "today", component: TodayComponent},
    {path: "inbox", component: InboxComponent},
    {path: "upcoming", component: UpcomingComponent},
    {path: "project", component: ProjectComponent},
    {path: "project/:id/tasks", component: ProjectTasksComponent},
    {path: "all-tasks", component: AllTasksComponent},
    {path: "search", component: SearchComponent},
    {path: "settings", component: SettingsComponent},
    {path: "sync", component: SynchronizationComponent},
    {path: '', redirectTo: 'today', pathMatch: 'full'},
];
