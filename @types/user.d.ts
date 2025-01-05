export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  token: string;
  role: string;
  storeId: string;
  storeName: string;
}

export interface IMetrics {
  totalOrders: number;
  signupCount: number;
  totalSales: number;
  storesCount: number;
}

export interface IStoreData {
  _id: string;
  storeName: string;
  description: string;
  social: string;
  website: string;
  pending: numnber;
  total: number;
}

export type CurrentUserContextType = {
  user: IUser;
  setUser: (user: IUser) => void;
};

//user interface
