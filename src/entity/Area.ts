import {Entity, Column, Index, PrimaryGeneratedColumn} from "typeorm";

@Index('idx_area_rank', ['area', 'rank'], {})
@Index('idx_department', ['department'], {})
@Entity()
export class Area {
    @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
    id: number;

    @Column('varchar', { name: 'area', length: 40 })
    area: string;

    @Column('int', { name: 'rank' })
    rank: number;

    @Column('varchar', { name: 'department', length: 50 })
    department: string;

    @Column('float', { name: 'count' })
    count: number;

    @Column('int', { name: 'faculty_num' })
    facultyNum: number;
}