import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { Terms } from "./terms.entity";
import { StudentInfo } from "./student_info.entity";
import { Transcript } from "./transcript.entity";

@Entity()
export class Enrollment {

    @PrimaryColumn("uuid")
    enrollment_id: string;

    @Column()
    student_number: string;

    @Column()
    student_full_name: string;

    @Column()
    student_birth_date: string;

    @Column()
    student_address: string;

    @Column()
    student_phone: string;

    @Column()
    student_email: string;

    @Column()
    student_ssn: string;

    @Column()
    student_sex: string;

    @Column()
    school_name: string;

    @Column()
    school_address: string;

    @Column()
    graduation_date: string;

    @Column()
    gpa: string;

    @Column()
    enrollment_status: string;

    @Column()
    grade_level: string;

    @Column({ type: 'jsonb' })
    terms: Terms

    @Column({ type: 'jsonb' })
    student_info: StudentInfo

    @Column({ type: 'jsonb' })
    transcript: Transcript

}
