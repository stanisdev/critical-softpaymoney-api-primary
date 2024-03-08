import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Balances')
export class BalanceEntity {
    @PrimaryGeneratedColumn()
    id: number;
}
