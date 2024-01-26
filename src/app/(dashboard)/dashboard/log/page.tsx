import BreadCrumb from "@/components/breadcrumb";
import { LogClient } from "@/components/tables/log-tables/client";

import { faker } from '@faker-js/faker';

const breadcrumbItems = [{ title: "Log", link: "/dashboard/log" }];
export default function page() {


  const logs = Array.from({ length: 10 }).map(() => ({
    _id: faker.string.uuid(),
    phone: faker.phone.number(),
    status: faker.helpers.arrayElement(["success", "failed"]),
    timestamp: faker.date.recent(),
    messageId: faker.number.int(),
    imageId: faker.string.uuid(),
  }));

  return (
    <>
      <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <LogClient data={logs} />
      </div>
    </>
  );
}
