import { IsEnum } from 'class-validator';
import { IncomingRequestStatus, PaymentSystem } from 'src/common/enums/general';
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
    @IsEnum(PaymentSystem)
    paymentSystem: PaymentSystem;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
