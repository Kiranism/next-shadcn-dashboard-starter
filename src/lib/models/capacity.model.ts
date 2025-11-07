import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { BaseModel } from './base.model';
import type { Hospital } from './hospital.model';
import type { Facility } from './facility.model';
import { WardType } from '../enums';

export class Capacity extends BaseModel {
  @prop({ required: true, ref: 'Hospital' })
  public hospitalId!: Ref<Hospital>;

  @prop({ required: true, enum: WardType })
  public wardType!: WardType;

  @prop({ required: true })
  public totalBeds!: number;

  @prop({ required: true })
  public occupiedBeds!: number;

  @prop()
  public availableBeds?: number;

  @prop({ type: () => [Types.ObjectId], ref: 'Facility' })
  public equipmentIds?: Ref<Facility>[];

  @prop()
  public notes?: string;
}

export const CapacityModel = getModelForClass(Capacity);
