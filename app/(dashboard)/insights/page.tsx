import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function InsightsRoutePage() {
  redirect("/needle/insights");
}