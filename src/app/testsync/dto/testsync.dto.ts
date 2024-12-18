import { Updatable } from "../../services/service.abstract";

export interface TestSyncDto extends Updatable {
    uuid: string;
    id: number;
    user_uuid: string;
    name: string;
    created: Date;
    description: string;
    enabled: number;
}

export type TestSyncAddDto = Omit<TestSyncDto, "id" >;

