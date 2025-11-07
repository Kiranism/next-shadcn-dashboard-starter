export enum WardType {
  VIP = 'VIP',
  NORMAL = 'Normal',
  EMERGENCY = 'Emergency',
  ICU = 'ICU',
  MATERNITY = 'Maternity',
  PEDIATRICS = 'Pediatrics',
  OTHER = 'Other'
}

export enum BillStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIAL = 'Partial',
  CANCELLED = 'Cancelled'
}

export enum PaymentMethod {
  CASH = 'Cash',
  CARD = 'Card',
  BANK_TRANSFER = 'Bank Transfer',
  INSURANCE = 'Insurance'
}

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday'
}

export enum FacilityCategory {
  EQUIPMENT = 'Equipment',
  MEDICATION = 'Medication',
  FACILITY = 'Facility'
}

export enum FacilityStatus {
  OPERATIONAL = 'Operational',
  OUT_OF_SERVICE = 'Out of Service',
  UNDER_MAINTENANCE = 'Under Maintenance'
}

export enum HospitalType {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  DISPENSARY = 'dispensary',
  NGO = 'ngo',
  OTHER = 'other'
}

export enum OwnershipType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SEMI_GOVERNMENT = 'semi-government',
  NGO = 'ngo'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-'
}

export enum MedicalConditionStatus {
  ACTIVE = 'active',
  RECOVERED = 'recovered',
  CHRONIC = 'chronic'
}

export enum WorkerGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other'
}

export enum Designation {
  NURSE = 'Nurse',
  PARAMEDIC = 'Paramedic',
  TECHNICIAN = 'Technician',
  OTHER = 'Other'
}

export enum Department {
  ICU = 'ICU',
  EMERGENCY = 'Emergency',
  RADIOLOGY = 'Radiology',
  GENERAL_WARD = 'General Ward',
  LABORATORY = 'Laboratory',
  OTHER = 'Other'
}

export enum ShiftType {
  MORNING = 'Morning',
  EVENING = 'Evening',
  NIGHT = 'Night',
  ROTATIONAL = 'Rotational'
}

export enum AppointmentStatus {
  SCHEDULED = 'Scheduled',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
  NO_SHOW = 'No Show'
}

export enum Priority {
  NORMAL = 'Normal',
  URGENT = 'Urgent'
}

export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}
