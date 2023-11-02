import { UserClient } from "@/components/tables/user-tables/client";
import { users } from "@/constants/data";
import React from "react";

export default function page() {
  return (
    <>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserClient data={users} />
      </div>
    </>
  );
}
