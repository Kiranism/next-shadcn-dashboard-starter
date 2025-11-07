import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import type { Patient } from './patient.model';
import type { Hospital } from './hospital.model';
import type { Doctor } from './doctor.model';
import type { MedicalRecord } from './medical-record.model';
import { BillStatus, PaymentMethod } from '../enums';

class BillItem {
  @prop()
  public description?: string;

  @prop()
  public quantity?: number;

  @prop()
  public unitPrice?: number;

  @prop()
  public amount?: number;
}

export class Bill extends BaseModel {
  @prop({ required: true, ref: 'Patient' })
  public patientId!: Ref<Patient>;

  @prop({ required: true, ref: 'Hospital' })
  public hospitalId!: Ref<Hospital>;

  @prop({ ref: 'Doctor' })
  public doctorId?: Ref<Doctor>;

  @prop({ ref: 'MedicalRecord' })
  public medicalRecordId?: Ref<MedicalRecord>;

  @prop({ required: true })
  public billDate!: Date;

  @prop({ required: true })
  public totalAmount!: number;

  @prop({ required: true })
  public paidAmount!: number;

  @prop({ required: true, enum: BillStatus })
  public status!: BillStatus;

  @prop({ required: true, enum: PaymentMethod })
  public paymentMethod!: PaymentMethod;

  @prop({ type: () => [BillItem] })
  public items?: BillItem[];

  @prop()
  public discount?: number;
}

export const BillModel = getModelForClass(Bill);
