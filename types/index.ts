export enum Civility {
  MR = "Mr",
  MME = "Mme",
  MLLE = "Mlle",
}

export enum FamilySituation {
  SINGLE = "Single",
  MARRIED = "Married",
  DIVORCED = "Divorced",
  WIDOW = "Widow",
}

export enum Department {
  IT = "IT",
  PRODUCTION = "Production",
  MANAGER = "Manager",
  TEAM_LEAD = "Chef d’équipe",
  FINISHING = "Finition",
  PACKAGING = "Emballage",
  CLEANING = "Femme de Ménage",
}

export enum ContractType {
  CDD = "CDD",
  CDI = "CDI",
  SIVP = "SIVP",
}

export enum PaymentType {
  HOURLY = "Hourly",
  MONTHLY = "Monthly",
}

export enum PaymentMethod {
  CASH = "Cash",
  BANK = "Bank",
}

export enum EmployeeStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

export interface Employee {
  EmployeeId: string;
  Civility: Civility;
  FullName: string;
  Phone: string;
  Address: string;
  FamilySituation: FamilySituation;
  cin: string;
  cnss: string;
  department: Department;
  position: string;
  hireDate: Date | string;
  contractType: ContractType;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  bankName?: string;
  bankAccount?: string;
  hourlyRate?: number;
  monthlySalary?: number;
  status: EmployeeStatus;
}
