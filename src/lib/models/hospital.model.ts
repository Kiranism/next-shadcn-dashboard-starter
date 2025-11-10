import { Schema, model, models } from 'mongoose';
import { HospitalType, OwnershipType } from '../enums';

const LocationSchema = new Schema(
  {
    area: String,
    city: String,
    country: String,
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    primaryNumber: String,
    secondaryNumber: String
  },
  { _id: false }
);

const HospitalSchema = new Schema(
  {
    name: { type: String, required: true },
    location: LocationSchema,
    contact: ContactSchema,
    type: { type: String, required: true, enum: Object.values(HospitalType) },
    ownershipType: {
      type: String,
      required: true,
      enum: Object.values(OwnershipType)
    },
    registrationNumber: { type: String, required: true }
  },
  { timestamps: true }
);

export const HospitalModel =
  models.Hospital || model('Hospital', HospitalSchema);
