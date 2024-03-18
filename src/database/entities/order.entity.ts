import { IsEnum } from 'class-validator';
import { OrderStatus, PaymentSystem } from 'src/common/enums/general';
import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('Orders')
export class OrderEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    mongoOrderId: string;

    @Column()
    mongoProductId: string;

    @Column()
    @IsEnum(PaymentSystem)
    paymentSystem: PaymentSystem;

    @Column()
    amount: number;

    @Column()
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
