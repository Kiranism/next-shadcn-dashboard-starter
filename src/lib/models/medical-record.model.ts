import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import type { Patient } from './patient.model';
import type { Doctor } from './doctor.model';
import type { Hospital } from './hospital.model';

class Prescription {
  @prop()
  public medicineName?: string;

  @prop()
  public dosage?: string;

  @prop()
  public frequency?: string;

  @prop()
  public duration?: string;

  @prop()
  public notes?: string;
}

class TestOrdered {
  @prop()
  public testName?: string;

  @prop()
  public results?: string;

  @prop()
  public testDate?: Date;
}

class Attachment {
  @prop()
  public fileName?: string;

  @prop()
  public fileUrl?: string;

  @prop()
  public fileType?: string;
}

export class MedicalRecord extends BaseModel {
  @prop({ required: true, ref: 'Patient' })
  public patientId!: Ref<Patient>;

  @prop({ required: true, ref: 'Doctor' })
  public doctorId!: Ref<Doctor>;

  @prop({ required: true, ref: 'Hospital' })
  public hospitalId!: Ref<Hospital>;

  @prop()
  public visitDate?: Date;

  @prop()
  public diagnosis?: string;

  @prop({ type: () => [String] })
  public symptoms?: string[];

  @prop({ type: () => [Prescription] })
  public prescriptions?: Prescription[];

  @prop({ type: () => [TestOrdered] })
  public testsOrdered?: TestOrdered[];

  @prop({ type: () => [String] })
  public allergies?: string[];

  @prop()
  public treatmentPlan?: string;

  @prop()
  public followUpDate?: Date;

  @prop()
  public notes?: string;

  @prop({ type: () => [Attachment] })
  public attachments?: Attachment[];
}

export const MedicalRecordModel = getModelForClass(MedicalRecord);
