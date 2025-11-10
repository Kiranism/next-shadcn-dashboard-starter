import { Schema, model, models } from 'mongoose';
import { AppointmentStatus, Priority } from '../enums';

const AppointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(AppointmentStatus)
    },
    reason: String,
    priority: { type: String, enum: Object.values(Priority) }
  },
  { timestamps: true }
);

export const AppointmentModel =
  models.Appointment || model('Appointment', AppointmentSchema);
