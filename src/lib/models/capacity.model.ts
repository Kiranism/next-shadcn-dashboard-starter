import { Schema, model, models } from 'mongoose';
import { WardType } from '../enums';

const CapacitySchema = new Schema(
  {
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    wardType: { type: String, required: true, enum: Object.values(WardType) },
    totalBeds: { type: Number, required: true },
    occupiedBeds: { type: Number, required: true },
    availableBeds: Number,
    equipmentIds: [{ type: Schema.Types.ObjectId, ref: 'Facility' }],
    notes: String
  },
  { timestamps: true }
);

export const CapacityModel =
  models.Capacity || model('Capacity', CapacitySchema);
