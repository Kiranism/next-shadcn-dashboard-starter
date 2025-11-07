import { Schema, model, models } from 'mongoose';
import { Department, Designation, ShiftType, WorkerGender } from '../enums';

const WorkerContactSchema = new Schema(
  {
    primaryNumber: String,
    secondaryNumber: String,
    area: String,
    city: String,
    state: String
  },
  { _id: false }
);

const ShiftSchema = new Schema(
  {
    type: { type: String, enum: Object.values(ShiftType) },
    startTime: String,
    endTime: String
  },
  { _id: false }
);

const SchemeSchema = new Schema(
  {
    name: String,
    organization: String,
    role: String,
    startDate: Date,
    endDate: Date,
    remarks: String
  },
  { _id: false }
);

const WorkerSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: Object.values(WorkerGender) },
    dateOfBirth: Date,
    cnic: { type: String, required: true },
    cnicIV: { type: String, required: true },
    designation: {
      type: String,
      required: true,
      enum: Object.values(Designation)
    },
    department: { type: String, enum: Object.values(Department) },
    experienceYears: Number,
    qualifications: [String],
    shift: ShiftSchema,
    contact: WorkerContactSchema,
    hospitalIds: [{ type: Schema.Types.ObjectId, ref: 'Hospital' }],
    licenseNumber: String,
    schemes: [SchemeSchema]
  },
  { timestamps: true }
);

export const WorkerModel = models.Worker || model('Worker', WorkerSchema);
