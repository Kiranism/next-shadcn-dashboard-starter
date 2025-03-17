import { IResponseBase } from './base.schema';

export interface IUserBase {
  id: string;
  is_active: number;
  created_by?: string;
  created_user_name?: string;
  updated_by?: string;
  updated_user_name?: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  email: string;
  role: string;
}

export interface IUserAuth extends IUserBase {
  verification_token: string;
  refresh_token: string;
  reset_password_token: string;
  access_token: string;
  expires_at?: string;
}

export interface IUserResponse extends IResponseBase {
  payload: IUserBase;
}

export interface IUserListResponse extends IResponseBase {
  payload: IUserBase[];
}

export interface IUserAuthResponse extends IResponseBase {
  payload: IUserAuth;
}
