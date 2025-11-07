import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import type { Patient } from './patient.model';
import type { Doctor } from './doctor.model';
import type { Hospital } from './hospital.model';
import { AppointmentStatus, Priority } from '../enums';

export class Appointment extends BaseModel {
  @prop({ required: true, ref: 'Patient' })
  public patientId!: Ref<Patient>;

  @prop({ required: true, ref: 'Doctor' })
  public doctorId!: Ref<Doctor>;

  @prop({ required: true, ref: 'Hospital' })
  public hospitalId!: Ref<Hospital>;

  @prop({ required: true })
  public appointmentDate!: Date;

  @prop({ required: true, enum: AppointmentStatus })
  public status!: AppointmentStatus;

  @prop()
  public reason?: string;

  @prop({ enum: Priority })
  public priority?: Priority;
}

export const AppointmentModel = getModelForClass(Appointment);
