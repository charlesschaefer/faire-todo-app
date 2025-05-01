import { Routes } from "@angular/router";

import { AuthCallbackComponent } from "./auth/callback/callback.component";
import { InboxComponent } from "./inbox/inbox.component";
import { TodayComponent } from "./today/today.component";

export const routes: Routes = [
  { path: "inbox", component: InboxComponent }, //, resolve: {tasks: InboxResolver}},
  { path: "today", component: TodayComponent },
  {
    path: "upcoming",
    loadComponent: () =>
      import("./upcoming/upcoming.component").then(
        (comp) => comp.UpcomingComponent,
      ),
  },
  {
    path: "project",
    loadComponent: () =>
      import("./project/project.component").then(
        (comp) => comp.ProjectComponent,
      ),
  },
  {
    path: "project/:id/tasks",
    loadComponent: () =>
      import("./project/project-tasks/project-tasks.component").then(
        (comp) => comp.ProjectTasksComponent,
      ),
  },
  {
    path: "all-tasks",
    loadComponent: () =>
      import("./all-tasks/all-tasks.component").then(
        (comp) => comp.AllTasksComponent,
      ),
  },
  {
    path: "search",
    loadComponent: () =>
      import("./search/search.component").then((comp) => comp.SearchComponent),
  },
  {
    path: "settings",
    loadComponent: () =>
      import("./settings/settings.component").then(
        (comp) => comp.SettingsComponent,
      ),
  },
  {
    path: "sync",
    loadComponent: () =>
      import("./synchronization/synchronization.component").then(
        (comp) => comp.SynchronizationComponent,
      ),
  },
  { path: "auth/callback", component: AuthCallbackComponent },
  {
    path: "license",
    loadComponent: () =>
      import("./license/license.component").then(
        (comp) => comp.LicenseComponent,
      ),
  },
  { path: "", redirectTo: "today", pathMatch: "full" },
];
