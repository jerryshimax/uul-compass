import { demoCustomers } from "@/lib/data/demo/customers";
import { demoProjects } from "@/lib/data/demo/projects";
import { CustomersContent } from "./customers-content";

export default function CustomersPage() {
  const projectCountByCustomer = demoProjects.reduce<Record<string, number>>((acc, p) => {
    acc[p.customerId] = (acc[p.customerId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <CustomersContent
      customers={demoCustomers}
      projectCountByCustomer={projectCountByCustomer}
    />
  );
}
