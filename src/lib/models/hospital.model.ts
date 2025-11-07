import { getModelForClass, prop } from '@typegoose/typegoose';
import { BaseModel } from './base.model';
import { HospitalType, OwnershipType } from '../enums';

class Location {
  @prop()
  public area?: string;

  @prop()
  public city?: string;

  @prop()
  public country?: string;

  @prop()
  public latitude?: number;

  @prop()
  public longitude?: number;
}

class Contact {
  @prop()
  public primaryNumber?: string;

  @prop()
  public secondaryNumber?: string;
}

export class Hospital extends BaseModel {
  @prop({ required: true })
  public name!: string;

  @prop()
  public location?: Location;

  @prop()
  public contact?: Contact;

  @prop({ required: true, enum: HospitalType })
  public type!: HospitalType;

  @prop({ required: true, enum: OwnershipType })
  public ownershipType!: OwnershipType;

  @prop({ required: true })
  public registrationNumber!: string;
}

export const HospitalModel = getModelForClass(Hospital);
