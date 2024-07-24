import { Routes } from "@angular/router";
import { TodayComponent } from "./today/today.component";
import { InboxComponent } from "./inbox/inbox.component";

export const routes: Routes = [
    {path: "today", component: TodayComponent},
    {path: "inbox", component: InboxComponent},
];
