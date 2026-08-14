import { LessonPlayer } from "@/components/LessonPlayer";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LessonPlayer key={id} lessonId={Number(id)} />;
}
