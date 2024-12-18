import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { ProjectAddDto, ProjectDto } from '../dto/project-dto';

@Injectable({
    providedIn: 'root'
})
export class ProjectService extends ServiceAbstract<ProjectDto | ProjectAddDto> {
    storeName = "project";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }
}
