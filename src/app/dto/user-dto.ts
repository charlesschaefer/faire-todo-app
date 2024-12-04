export interface UserDto {
    id: number;
    uuid: string;
    email: string;
    name: string | null;
    created_at: Date;
}

export type UserAddDto = Omit<UserDto, "id">; 