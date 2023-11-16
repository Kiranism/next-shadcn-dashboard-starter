import BreadCrumb from "@/components/breadcrumb";
import { EmployeeClient } from "@/components/tables/employee-tables/client";
import { UserClient } from "@/components/tables/user-tables/client";
import { Employee, users } from "@/constants/data";

const breadcrumbItems = [{ title: "User", link: "/dashboard/user" }];
export default async function page() {
  const res = await fetch("https://api.slingacademy.com/v1/sample-data/users");
  const employeeRes = await res.json();
  const employee: Employee[] = employeeRes.users;
  return (
    <>
      <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <EmployeeClient data={employee} />
      </div>
    </>
  );
}
