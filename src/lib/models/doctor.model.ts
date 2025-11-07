import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { BaseModel } from './base.model';
import type { Hospital } from './hospital.model';
import { DayOfWeek, Gender } from '../enums';

class DoctorContact {
  @prop()
  public area?: string;

  @prop()
  public city?: string;

  @prop()
  public state?: string;

  @prop()
  public primaryNumber?: string;

  @prop()
  public secondaryNumber?: string;
}

class TimeSlot {
  @prop()
  public start?: string;

  @prop()
  public end?: string;
}

class Availability {
  @prop({ type: () => [String], enum: DayOfWeek })
  public days?: DayOfWeek[];

  @prop({ type: () => [TimeSlot] })
  public timeSlots?: TimeSlot[];
}

export class Doctor extends BaseModel {
  @prop({ required: true })
  public name!: string;

  @prop({ enum: Gender })
  public gender?: Gender;

  @prop()
  public dateOfBirth?: Date;

  @prop({ required: true })
  public cnic!: string;

  @prop({ required: true })
  public cnicIV!: string;

  @prop()
  public specialization?: string;

  @prop()
  public experienceYears?: number;

  @prop({ type: () => [String] })
  public subSpecialization?: string[];

  @prop({ type: () => [String] })
  public qualifications?: string[];

  @prop({ required: true })
  public licenseNumber!: string;

  @prop()
  public contact?: DoctorContact;

  @prop({ type: () => [Types.ObjectId], ref: 'Hospital' })
  public hospitalIds?: Ref<Hospital>[];

  @prop()
  public availability?: Availability;
}

export const DoctorModel = getModelForClass(Doctor);
