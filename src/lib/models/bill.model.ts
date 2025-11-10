import { Schema, model, models } from 'mongoose';
import { BillStatus, PaymentMethod } from '../enums';

const BillItemSchema = new Schema(
  {
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number
  },
  { _id: false }
);

const BillSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    hospitalId: {
      type: Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true
    },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
    medicalRecordId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },
    billDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    status: { type: String, required: true, enum: Object.values(BillStatus) },
    paymentMethod: {
      type: String,
      required: true,
      enum: Object.values(PaymentMethod)
    },
    items: [BillItemSchema],
    discount: Number
  },
  { timestamps: true }
);

export const BillModel = models.Bill || model('Bill', BillSchema);
