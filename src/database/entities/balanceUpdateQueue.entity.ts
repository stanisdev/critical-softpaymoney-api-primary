import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('BalanceUpdateQueue')
export class BalanceUpdateQueueEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    balanceId: number;

    @Column()
    amount: number;

    @Column()
    operation: string;
}
