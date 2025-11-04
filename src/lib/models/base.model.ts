import { prop } from '@typegoose/typegoose';

export abstract class BaseModel {
  @prop({ default: Date.now })
  public createdAt?: Date;

  @prop({ default: Date.now })
  public updatedAt?: Date;
}
