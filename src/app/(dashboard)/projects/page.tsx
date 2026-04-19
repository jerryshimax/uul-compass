import { demoProjects, demoProjectMilestones } from "@/lib/data/demo/projects";
import { demoCustomers } from "@/lib/data/demo/customers";
import { ProjectsContent } from "./projects-content";

export default function ProjectsPage() {
  const customerById = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));

  const milestonesByProject = demoProjectMilestones.reduce<
    Record<string, { atRisk: number; nextTargetDate?: string; nextSlack?: number }>
  >((acc, m) => {
    if (!acc[m.projectId]) acc[m.projectId] = { atRisk: 0 };
    if (m.status === "at_risk") acc[m.projectId].atRisk += 1;
    if ((m.status === "upcoming" || m.status === "at_risk") && !acc[m.projectId].nextTargetDate) {
      acc[m.projectId].nextTargetDate = m.targetDate;
      acc[m.projectId].nextSlack = m.daysSlack;
    }
    return acc;
  }, {});

  return (
    <ProjectsContent
      projects={demoProjects}
      customerById={customerById}
      milestonesByProject={milestonesByProject}
    />
  );
}
