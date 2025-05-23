import { IProfileData } from './query.types';

export enum UserRole {
  JOBSEEKER = 'JOBSEEKER',
  RECRUITER = 'RECRUITER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface IUser extends IProfileData {
  _id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: IUser;
  };
}

export interface IRegisterResponse {
  success: boolean;
  message: string;
  data: { user: IUser; token: string };
}

export interface IForgetPasswordResponse {
  success: boolean;
  message: string;
  data: {
    userId: string;
    resetLink: string;
  };
}

export interface IResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  response?: {
    data: {
      message: string;
    };
  };
  message: string;
}
