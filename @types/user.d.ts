export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  token: string;
  role: string;
}

export interface IMetrics {
  ordersCount: number;
  signupCount: number;
  totalSales: number;
  storesCount: number;
}

export type CurrentUserContextType = {
  user: IUser;
  setUser: (user: IUser) => void;
};

//user interface
