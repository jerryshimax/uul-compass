import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/data/demo/customers";
import { getProjectsByCustomer } from "@/lib/data/demo/projects";
import { CustomerDetailContent } from "./customer-detail-content";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = getCustomer(id);
  if (!customer) notFound();

  const projects = getProjectsByCustomer(id);

  return <CustomerDetailContent customer={customer} projects={projects} />;
}
