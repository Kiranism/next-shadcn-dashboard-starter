import { Schema, model, models } from 'mongoose';
import { FacilityCategory, FacilityStatus } from '../enums';

const FacilitySchema = new Schema(
  {
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: Object.values(FacilityCategory)
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    inUse: Number,
    status: {
      type: String,
      required: true,
      enum: Object.values(FacilityStatus)
    }
  },
  { timestamps: true }
);

export const FacilityModel =
  models.Facility || model('Facility', FacilitySchema);
