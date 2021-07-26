import {Entity, Column, Index, PrimaryGeneratedColumn} from "typeorm";

@Index('idx_area_rank', ['area', 'rank'], {})
@Index('idx_department', ['department'], {})
@Entity()
export class Program {
    @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

    @Column('varchar', { name: 'name', length: 50 })
    name: string;

    @Column('varchar', { name: 'degree', length: 10 })
    degree: string;

    @Column('int', { name: 'duration' })
    duration: number;

    @Column('varchar', { name: 'department', length: 50 })
    department: string;

    @Column('varchar', { name: 'city', length: 30 })
    city: string;

    @Column('varchar', { name: 'state', length: 30 })
    state: string;

    @Column('float', { name: 'credit' })
    credit: number;

    @Column('int', { name: 'toefl' })
    toefl: number;

    @Column('text', { name: 'description' })
    description: string;

    @Column('float', { name: 'gpa' })
    gpa: number;

    @Column('varchar', { name: 'state', length: 50 })
    titles: string;

    @Column('int', { name: 'payment_type' })
    paymentType: number;

    @Column('int', { name: 'payment_per_unit' })
    paymentPerUnit: number;

    @Column('int', { name: 'total_payment' })
    totalPayment: number;

    @Column('int', { name: 'living_costs_min' })
    living_costs_min: number;

    @Column('int', { name: 'living_costs_max' })
    living_costs_max: number;
}