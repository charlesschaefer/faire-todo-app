export interface UserDto {
    id: number;
    uuid: string;
    email: string;
    name: string | null;
    created_at: Date;
    avatar_url: string | null;
    updated_at?: Date;
}

export type UserAddDto = Omit<UserDto, "id">; 