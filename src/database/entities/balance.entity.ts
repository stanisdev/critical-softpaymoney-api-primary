import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Min, Length, IsNumber, IsEnum } from 'class-validator';
import { Сurrency } from 'src/common/enums/general';

@Entity('Balances')
export class BalanceEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNumber()
    @Min(0)
    value: number;

    @Column()
    @IsEnum(Сurrency)
    currencyType: Сurrency;

    @Column()
    @Length(24)
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
