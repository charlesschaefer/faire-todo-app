import { Injectable } from '@angular/core';
import { ServiceAbstract } from './service.abstract';
import { DbService } from './db.service';
import { AuthService } from './auth.service';
import { TagAddDto, TagDto } from '../dto/tag-dto';

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
