import { notFound } from "next/navigation";
import { getTaskById, getWorkstreams, getUsers } from "@/lib/data";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { TaskDetailContent } from "./task-detail-content";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;

  const [task, workstreams, userOptions, currentUser] = await Promise.all([
    getTaskById(id),
    getWorkstreams(),
    getUsers(),
    getCurrentUser(),
  ]);

  if (!task) notFound();

  return (
    <TaskDetailContent
      task={task}
      workstreams={workstreams}
      userOptions={userOptions}
      currentUser={currentUser}
    />
  );
}
