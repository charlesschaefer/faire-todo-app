import { Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';
import { TagAddDto, TagDto } from '../dto/tag-dto';
import { DbService } from '../db/db.service';
import { ServiceAbstract } from './service.abstract';

@Injectable({
    providedIn: 'root'
})
export class TagService extends ServiceAbstract<TagDto | TagAddDto> {
    storeName = "tag";

    constructor(
        protected dbService: DbService,
        protected override authService: AuthService
    ) {
        super(authService);
        this.setTable();
    }

}
