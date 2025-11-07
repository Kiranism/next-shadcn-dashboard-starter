import { getModelForClass, prop } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import { BloodGroup, Gender, MedicalConditionStatus } from '../enums';

class PatientContact {
  @prop()
  public primaryNumber?: string;

  @prop()
  public secondaryNumber?: string;

  @prop()
  public address?: string;

  @prop()
  public city?: string;

  @prop()
  public state?: string;
}

class EmergencyContact {
  @prop()
  public name?: string;

  @prop()
  public relation?: string;

  @prop()
  public phoneNo?: string;
}

class MedicalHistoryItem {
  @prop()
  public condition?: string;

  @prop()
  public diagnosedAt?: Date;

  @prop({ enum: MedicalConditionStatus })
  public status?: MedicalConditionStatus;
}

export class Patient extends BaseModel {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true, enum: Gender })
  public gender!: Gender;

  @prop({ required: true })
  public dateOfBirth!: Date;

  @prop({ required: true })
  public cnic!: string;

  @prop({ required: true })
  public cnicIV!: string;

  @prop({ enum: BloodGroup })
  public bloodGroup?: BloodGroup;

  @prop()
  public contact?: PatientContact;

  @prop()
  public emergencyContact?: EmergencyContact;

  @prop({ type: () => [MedicalHistoryItem] })
  public medicalHistory?: MedicalHistoryItem[];
}

export const PatientModel = getModelForClass(Patient);
