import { Updatable } from "./updatable";

export interface UserDto extends Updatable {
    id: number;
    uuid: string;
    email: string;
    name: string | null;
    created_at: Date;
    avatar_url: string | null;
    updated_at?: Date;
}

export type UserAddDto = Omit<UserDto, "id">; 