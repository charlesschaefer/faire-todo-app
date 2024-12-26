import { Injectable } from '@angular/core';
import { ServiceAbstract } from '../services/service.abstract';
import { DbService } from '../services/db.service';
import { AuthService } from '../auth/auth.service';
import { ProjectAddDto, ProjectDto } from '../dto/project-dto';
import { DataUpdatedService } from '../services/data-updated.service';

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
