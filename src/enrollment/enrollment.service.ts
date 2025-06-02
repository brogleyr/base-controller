import { Injectable } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnrollmentService {

  constructor(
      @InjectRepository(Enrollment)
      private enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const enrollment = new Enrollment();
    enrollment.enrollment_id = uuidv4();
    enrollment.student_number = createEnrollmentDto?.studentNumber;
    enrollment.student_full_name = createEnrollmentDto?.studentFullName;
    enrollment.student_birth_date = createEnrollmentDto?.studentBirthDate;
    enrollment.student_address = createEnrollmentDto?.studentInfo?.studentAddress;
    enrollment.student_phone = createEnrollmentDto?.studentInfo?.studentPhone;
    enrollment.student_email = createEnrollmentDto?.studentInfo?.studentEmail;
    enrollment.student_ssn = createEnrollmentDto?.studentInfo?.studentSsn;
    enrollment.student_sex = createEnrollmentDto?.studentInfo?.studentSex;
    enrollment.school_name = createEnrollmentDto?.studentInfo?.schoolName;
    enrollment.school_address = createEnrollmentDto?.studentInfo?.schoolAddress;
    enrollment.graduation_date = createEnrollmentDto?.studentInfo?.graduationDate;
    enrollment.gpa = createEnrollmentDto?.transcript?.gpa;
    enrollment.enrollment_status = "started";
    enrollment.grade_level = createEnrollmentDto?.studentInfo?.gradeLevel;
    enrollment.terms = createEnrollmentDto?.terms;
    enrollment.student_info = createEnrollmentDto?.studentInfo;
    enrollment.transcript = createEnrollmentDto?.transcript;
    //console.log("About to save enrollment=", enrollment);
    return await this.enrollmentRepository.save(enrollment);
  }

  async findAll(): Promise<Enrollment[]> {
    return await this.enrollmentRepository.find();
  }

  async findOne(id: string): Promise<Enrollment> {
    return await this.enrollmentRepository.findOneBy({enrollment_id: id });
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    return await this.enrollmentRepository.update(id, { enrollment_status: updateEnrollmentDto.enrollment_status });
  }

  async remove(id: string) {
    return await this.enrollmentRepository.delete(id);
  }
}
