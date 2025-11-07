import { Schema, model, models } from 'mongoose';
import { BloodGroup, Gender, MedicalConditionStatus } from '../enums';

const PatientContactSchema = new Schema(
  {
    primaryNumber: String,
    secondaryNumber: String,
    address: String,
    city: String,
    state: String
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema(
  {
    name: String,
    relation: String,
    phoneNo: String
  },
  { _id: false }
);

const MedicalHistoryItemSchema = new Schema(
  {
    condition: String,
    diagnosedAt: Date,
    status: { type: String, enum: Object.values(MedicalConditionStatus) }
  },
  { _id: false }
);

const PatientSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, required: true, enum: Object.values(Gender) },
    dateOfBirth: { type: Date, required: true },
    cnic: { type: String, required: true },
    cnicIV: { type: String, required: true },
    bloodGroup: { type: String, enum: Object.values(BloodGroup) },
    contact: PatientContactSchema,
    emergencyContact: EmergencyContactSchema,
    medicalHistory: [MedicalHistoryItemSchema]
  },
  { timestamps: true }
);

export const PatientModel = models.Patient || model('Patient', PatientSchema);
