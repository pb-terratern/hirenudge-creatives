import { DraftClient } from "@/components/production-ui";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DraftClient contentId={id} />;
}
