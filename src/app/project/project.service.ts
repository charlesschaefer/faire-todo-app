import { Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { ProjectAddDto, ProjectDto } from '../dto/project-dto';
import { DataUpdatedService } from '../db/data-updated.service';
import { DbService } from '../db/db.service';
import { ServiceAbstract } from '../services/service.abstract';

@Injectable({
    providedIn: 'root'
})
export class ProjectService extends ServiceAbstract<ProjectDto | ProjectAddDto> {
    storeName = "project";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService,
        protected override dataUpdatedService: DataUpdatedService,
    ) {
        super(authService);
        this.setTable();
    }
}
