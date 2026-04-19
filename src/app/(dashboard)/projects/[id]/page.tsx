import { notFound } from "next/navigation";
import { getProject, getPhasesByProject, getMilestonesByProject } from "@/lib/data/demo/projects";
import { getCustomer } from "@/lib/data/demo/customers";
import { ProjectDetailContent } from "./project-detail-content";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const customer = getCustomer(project.customerId);
  if (!customer) notFound();

  const phases = getPhasesByProject(id);
  const milestones = getMilestonesByProject(id);

  return (
    <ProjectDetailContent
      project={project}
      customer={customer}
      phases={phases}
      milestones={milestones}
    />
  );
}
