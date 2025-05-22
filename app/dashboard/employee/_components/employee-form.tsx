'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Civility,
  FamilySituation,
  Department,
  ContractType,
  PaymentType,
  PaymentMethod,
  EmployeeStatus,
  Employee // Assuming Employee type is used for type checking onSubmit, not directly in form values
} from '@/types'; // Adjusted import path
import { generateEmployeeId } from '@/lib/utils'; // Assuming this is the path

// Define Zod enums from TypeScript enums
const CivilityEnum = z.nativeEnum(Civility);
const FamilySituationEnum = z.nativeEnum(FamilySituation);
const DepartmentEnum = z.nativeEnum(Department);
const ContractTypeEnum = z.nativeEnum(ContractType);
const PaymentTypeEnum = z.nativeEnum(PaymentType);
const PaymentMethodEnum = z.nativeEnum(PaymentMethod);
const EmployeeStatusEnum = z.nativeEnum(EmployeeStatus);

const formSchema = z
  .object({
    EmployeeId: z.string().min(1, 'Employee ID is required.'), // Will be auto-generated but good to have in schema
    Civility: CivilityEnum,
    FullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    Phone: z.string().min(8, 'Phone number seems too short.').max(20, 'Phone number seems too long.'), // Basic phone validation
    Address: z.string().min(5, 'Address must be at least 5 characters.'),
    FamilySituation: FamilySituationEnum,
    cin: z.string().min(8, 'CIN must be 8 characters.').max(8, 'CIN must be 8 characters.'), // Assuming CIN is 8 chars
    cnss: z.string().min(7, 'CNSS must be at least 7 digits.').max(10, 'CNSS seems too long.'), // Basic CNSS validation
    department: DepartmentEnum,
    position: z.string().min(2, 'Position must be at least 2 characters.'),
    hireDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format.'
    }), // Validate if string can be parsed to date
    contractType: ContractTypeEnum,
    paymentType: PaymentTypeEnum,
    paymentMethod: PaymentMethodEnum,
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
    hourlyRate: z.coerce.number().positive('Hourly rate must be positive.').optional(),
    monthlySalary: z.coerce.number().positive('Monthly salary must be positive.').optional(),
    status: EmployeeStatusEnum
  })
  .refine(
    (data) => {
      if (data.paymentType === PaymentType.HOURLY) {
        return data.hourlyRate !== undefined && data.hourlyRate > 0;
      }
      return true;
    },
    {
      message: 'Hourly rate is required when payment type is Hourly.',
      path: ['hourlyRate']
    }
  )
  .refine(
    (data) => {
      if (data.paymentType === PaymentType.MONTHLY) {
        return data.monthlySalary !== undefined && data.monthlySalary > 0;
      }
      return true;
    },
    {
      message: 'Monthly salary is required when payment type is Monthly.',
      path: ['monthlySalary']
    }
  )
  .refine(
    (data) => {
      if (data.paymentMethod === PaymentMethod.BANK) {
        return !!data.bankName && !!data.bankAccount;
      }
      return true;
    },
    {
      message: 'Bank name and account are required when payment method is Bank.',
      path: ['bankName'] // Could also be ['bankAccount'] or a general form error
    }
  );

export default function EmployeeForm({ initialData, nextEmployeeNumber }: { initialData?: Partial<z.infer<typeof formSchema>>, nextEmployeeNumber?: number }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      EmployeeId: initialData?.EmployeeId || (nextEmployeeNumber ? generateEmployeeId(nextEmployeeNumber) : ''),
      Civility: initialData?.Civility || undefined,
      FullName: initialData?.FullName || '',
      Phone: initialData?.Phone || '',
      Address: initialData?.Address || '',
      FamilySituation: initialData?.FamilySituation || undefined,
      cin: initialData?.cin || '',
      cnss: initialData?.cnss || '',
      department: initialData?.department || undefined,
      position: initialData?.position || '',
      hireDate: initialData?.hireDate || '',
      contractType: initialData?.contractType || undefined,
      paymentType: initialData?.paymentType || undefined,
      paymentMethod: initialData?.paymentMethod || undefined,
      bankName: initialData?.bankName || '',
      bankAccount: initialData?.bankAccount || '',
      hourlyRate: initialData?.hourlyRate || undefined,
      monthlySalary: initialData?.monthlySalary || undefined,
      status: initialData?.status || EmployeeStatus.ACTIVE
    }
  });

  const paymentType = form.watch('paymentType');
  const paymentMethod = form.watch('paymentMethod');

  // TODO: Get nextEmployeeNumber from a DB call or prop in a real scenario
  React.useEffect(() => {
    if (!initialData && nextEmployeeNumber) {
      form.setValue('EmployeeId', generateEmployeeId(nextEmployeeNumber));
    }
  }, [form, initialData, nextEmployeeNumber]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    // Convert string numbers to actual numbers before submission if necessary
    const processedValues = {
        ...values,
        hourlyRate: values.hourlyRate ? parseFloat(String(values.hourlyRate)) : undefined,
        monthlySalary: values.monthlySalary ? parseFloat(String(values.monthlySalary)) : undefined,
    };
    console.log(processedValues);
    // Further actions: API call to save data, etc.
  }

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          {initialData ? 'Edit Employee Information' : 'Add New Employee'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
              <FormField
                control={form.control}
                name="EmployeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input placeholder="EMP-0001" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="Civility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civility</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select civility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Civility).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="FullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="Address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="FamilySituation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Family Situation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select family situation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FamilySituation).map((fs) => (
                          <SelectItem key={fs} value={fs}>
                            {fs}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter CIN (8 digits)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cnss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNSS</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter CNSS number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Department).map((dep) => (
                          <SelectItem key={dep} value={dep}>
                            {dep}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter position" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contract type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ContractType).map((ct) => (
                          <SelectItem key={ct} value={ct}>
                            {ct}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card className="pt-4">
              <CardHeader><CardTitle className="text-xl">Payment Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="paymentType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.values(PaymentType).map((pt) => (
                                <SelectItem key={pt} value={pt}>
                                    {pt}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {paymentType === PaymentType.HOURLY && (
                    <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Hourly Rate</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Enter hourly rate" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    )}
                    {paymentType === PaymentType.MONTHLY && (
                    <FormField
                        control={form.control}
                        name="monthlySalary"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monthly Salary</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="Enter monthly salary" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    )}
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.values(PaymentMethod).map((pm) => (
                                <SelectItem key={pm} value={pm}>
                                    {pm}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {paymentMethod === PaymentMethod.BANK && (
                    <>
                        <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter bank name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bank Account</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter bank account number" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </>
                    )}
                    </div>
                </CardContent>
            </Card>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(EmployeeStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto">
              {initialData ? 'Save Changes' : 'Add Employee'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
