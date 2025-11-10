import { Schema, model, models } from 'mongoose';
import { DayOfWeek, Gender } from '../enums';

const DoctorContactSchema = new Schema(
  {
    area: String,
    city: String,
    state: String,
    primaryNumber: String,
    secondaryNumber: String
  },
  { _id: false }
);

const TimeSlotSchema = new Schema(
  {
    start: String,
    end: String
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    days: [{ type: String, enum: Object.values(DayOfWeek) }],
    timeSlots: [TimeSlotSchema]
  },
  { _id: false }
);

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender) },
    dateOfBirth: Date,
    cnic: { type: String, required: true },
    cnicIV: { type: String, required: true },
    specialization: String,
    experienceYears: Number,
    subSpecialization: [String],
    qualifications: [String],
    licenseNumber: { type: String, required: true },
    contact: DoctorContactSchema,
    hospitalIds: [{ type: Schema.Types.ObjectId, ref: 'Hospital' }],
    availability: AvailabilitySchema
  },
  { timestamps: true }
);

export const DoctorModel = models.Doctor || model('Doctor', DoctorSchema);
