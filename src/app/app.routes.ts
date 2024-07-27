import { Routes } from "@angular/router";
import { TodayComponent } from "./today/today.component";
import { InboxComponent } from "./inbox/inbox.component";
import { UpcomingComponent } from "./upcoming/upcoming.component";
import { ProjectComponent } from "./project/project.component";

export const routes: Routes = [
    {path: '', redirectTo: 'today', pathMatch: 'full'},
    {path: "today", component: TodayComponent},
    {path: "inbox", component: InboxComponent},
    {path: "upcoming", component: UpcomingComponent},
    {path: "project", component: ProjectComponent},
];
