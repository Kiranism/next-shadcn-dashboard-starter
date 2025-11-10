import { Schema, model, models } from 'mongoose';

const PrescriptionSchema = new Schema(
  {
    medicineName: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  },
  { _id: false }
);

const TestOrderedSchema = new Schema(
  {
    testName: String,
    results: String,
    testDate: Date
  },
  { _id: false }
);

const AttachmentSchema = new Schema(
  {
    fileName: String,
    fileUrl: String,
    fileType: String
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    visitDate: Date,
    diagnosis: String,
    symptoms: [String],
    prescriptions: [PrescriptionSchema],
    testsOrdered: [TestOrderedSchema],
    allergies: [String],
    treatmentPlan: String,
    followUpDate: Date,
    notes: String,
    attachments: [AttachmentSchema]
  },
  { timestamps: true }
);

export const MedicalRecordModel =
  models.MedicalRecord || model('MedicalRecord', MedicalRecordSchema);
