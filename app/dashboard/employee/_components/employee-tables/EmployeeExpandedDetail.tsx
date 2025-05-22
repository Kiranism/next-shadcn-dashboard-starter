import { Employee, Civility, FamilySituation, PaymentType, PaymentMethod, Department, ContractType, EmployeeStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmployeeExpandedDetailProps {
  employee: Employee;
}

const DetailItem: React.FC<{ label: string; value?: string | number | null | React.ReactNode; className?: string }> = ({ label, value, className }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`grid grid-cols-3 gap-2 py-1 ${className}`}>
      <span className="text-sm font-semibold text-gray-600">{label}:</span>
      <span className="col-span-2 text-sm text-gray-800">{value}</span>
    </div>
  );
};

const EmployeeExpandedDetail: React.FC<EmployeeExpandedDetailProps> = ({ employee }) => {
  return (
    <Card className="m-2 shadow-lg bg-slate-50">
      <CardHeader className="py-3 px-4 bg-slate-100 rounded-t-md">
        <CardTitle className="text-lg font-semibold">Additional Details - {employee.FullName}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
        <section>
          <h3 className="text-md font-medium text-slate-700 mb-2 border-b pb-1">Personal Information</h3>
          <DetailItem label="Civility" value={employee.Civility ? Civility[employee.Civility as keyof typeof Civility] : 'N/A'} />
          <DetailItem label="Address" value={employee.Address} />
          <DetailItem label="CIN" value={employee.cin} />
          <DetailItem label="CNSS" value={employee.cnss} />
          <DetailItem label="Family Situation" value={employee.FamilySituation ? FamilySituation[employee.FamilySituation as keyof typeof FamilySituation] : 'N/A'} />
        </section>
        
        <section>
          <h3 className="text-md font-medium text-slate-700 mb-2 border-b pb-1">Employment Details</h3>
           {/* These are already in main table, but can be repeated or other less critical info can be here */}
          <DetailItem label="Department" value={employee.department ? Department[employee.department as keyof typeof Department] : 'N/A'} />
          <DetailItem label="Position" value={employee.position} />
          <DetailItem label="Hire Date" value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'} />
          <DetailItem label="Contract Type" value={employee.contractType ? ContractType[employee.contractType as keyof typeof ContractType] : 'N/A'} />
           <DetailItem label="Status" value={
            employee.status ? (
              <Badge variant={employee.status === EmployeeStatus.ACTIVE ? 'secondary' : 'destructive'}>
                {EmployeeStatus[employee.status as keyof typeof EmployeeStatus]}
              </Badge>
            ) : 'N/A'
          }/>
        </section>

        <section>
          <h3 className="text-md font-medium text-slate-700 mb-2 border-b pb-1">Payment Information</h3>
          <DetailItem label="Payment Type" value={employee.paymentType ? PaymentType[employee.paymentType as keyof typeof PaymentType] : 'N/A'} />
          {employee.paymentType === PaymentType.HOURLY && (
            <DetailItem label="Hourly Rate" value={employee.hourlyRate ? `TND ${employee.hourlyRate.toFixed(2)}` : 'N/A'} />
          )}
          {employee.paymentType === PaymentType.MONTHLY && (
            <DetailItem label="Monthly Salary" value={employee.monthlySalary ? `TND ${employee.monthlySalary.toFixed(2)}` : 'N/A'} />
          )}
          <DetailItem label="Payment Method" value={employee.paymentMethod ? PaymentMethod[employee.paymentMethod as keyof typeof PaymentMethod] : 'N/A'} />
          {employee.paymentMethod === PaymentMethod.BANK && (
            <>
              <DetailItem label="Bank Name" value={employee.bankName} />
              <DetailItem label="Bank Account" value={employee.bankAccount} />
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default EmployeeExpandedDetail;
