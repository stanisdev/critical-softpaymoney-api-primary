import { IsEnum } from 'class-validator';
import { IncomingRequestStatus } from 'src/common/types/general';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('IncomingRequests')
export class IncomingRequestEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    payload: string;

    @Column()
    @IsEnum(IncomingRequestStatus)
    status: IncomingRequestStatus;

    @Column()
    from: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
