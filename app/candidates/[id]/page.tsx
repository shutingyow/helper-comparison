import { CandidateDetailClient } from "./CandidateDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CandidateDetailClient id={id} />;
}
