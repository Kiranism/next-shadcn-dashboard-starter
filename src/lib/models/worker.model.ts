import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { BaseModel } from './base.model';
import type { Hospital } from './hospital.model';
import { Department, Designation, ShiftType, WorkerGender } from '../enums';

class WorkerContact {
  @prop()
  public primaryNumber?: string;

  @prop()
  public secondaryNumber?: string;

  @prop()
  public area?: string;

  @prop()
  public city?: string;

  @prop()
  public state?: string;
}

class Shift {
  @prop({ enum: ShiftType })
  public type?: ShiftType;

  @prop()
  public startTime?: string;

  @prop()
  public endTime?: string;
}

class Scheme {
  @prop()
  public name?: string;

  @prop()
  public organization?: string;

  @prop()
  public role?: string;

  @prop()
  public startDate?: Date;

  @prop()
  public endDate?: Date;

  @prop()
  public remarks?: string;
}

export class Worker extends BaseModel {
  @prop({ required: true })
  public name!: string;

  @prop({ enum: WorkerGender })
  public gender?: WorkerGender;

  @prop()
  public dateOfBirth?: Date;

  @prop({ required: true })
  public cnic!: string;

  @prop({ required: true })
  public cnicIV!: string;

  @prop({ required: true, enum: Designation })
  public designation!: Designation;

  @prop({ enum: Department })
  public department?: Department;

  @prop()
  public experienceYears?: number;

  @prop({ type: () => [String] })
  public qualifications?: string[];

  @prop()
  public shift?: Shift;

  @prop()
  public contact?: WorkerContact;

  @prop({ type: () => [Types.ObjectId], ref: 'Hospital' })
  public hospitalIds?: Ref<Hospital>[];

  @prop()
  public licenseNumber?: string;

  @prop({ type: () => [Scheme] })
  public schemes?: Scheme[];
}

export const WorkerModel = getModelForClass(Worker);
