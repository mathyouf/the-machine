"use client";

import { useParams } from "next/navigation";
import { OptimizerDashboard } from "@/components/optimizer/Dashboard";

export default function OptimizerPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "demo";
  return <OptimizerDashboard sessionId={sessionId} />;
}
