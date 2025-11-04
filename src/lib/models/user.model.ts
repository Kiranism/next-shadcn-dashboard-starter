import { getModelForClass, prop } from '@typegoose/typegoose';
import { BaseModel } from './base.model';

export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export class User extends BaseModel {
  @prop({ required: true, unique: true })
  public clerkId!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ enum: Role, default: Role.STUDENT })
  public role!: Role;

  @prop()
  public name?: string;
}

export const UserModel = getModelForClass(User);
