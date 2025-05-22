export const generateEmployeeId = (employeeNumber: number): string => {
  const paddedNumber = String(employeeNumber).padStart(4, '0');
  return `EMP-${paddedNumber}`;
};
