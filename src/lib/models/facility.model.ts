import { getModelForClass, prop } from '@typegoose/typegoose';
import type { Ref } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import type { Hospital } from './hospital.model';
import { FacilityCategory, FacilityStatus } from '../enums';

export class Facility extends BaseModel {
  @prop({ required: true, ref: 'Hospital' })
  public hospitalId!: Ref<Hospital>;

  @prop({ required: true, enum: FacilityCategory })
  public category!: FacilityCategory;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public quantity!: number;

  @prop()
  public inUse?: number;

  @prop({ required: true, enum: FacilityStatus })
  public status!: FacilityStatus;
}

export const FacilityModel = getModelForClass(Facility);
