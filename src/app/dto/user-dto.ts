export interface UserDto {
    id: number;
    uuid: string;
    email: string;
    name: string | null;
    created_at: Date;
    avatar_url: string | null;
}

export type UserAddDto = Omit<UserDto, "id">; 