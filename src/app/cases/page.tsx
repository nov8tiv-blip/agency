import { redirect } from "next/navigation";
import Link from "next/link";
import { CASES, getDefaultCaseId } from "@/lib/cases";

type Props = {
  searchParams: Promise<{ code?: string }>;
};

export default async function CasesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const code = (sp?.code || "").trim().toUpperCase();

  // AUTO-SELECT CASE if code is present
  if (code) {
    const defaultCaseId = getDefaultCaseId();
    if (defaultCaseId) redirect(`/cases/${defaultCaseId}?code=${code}`);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Choose a Case</h1>
      <ul>
        {CASES.map((c) => (
          <li key={c.id} style={{ marginBottom: 16 }}>
            <h2>{c.title}</h2>
            <p>Difficulty: {c.difficulty}/5</p>
            <Link href={`/cases/${c.id}${code ? `?code=${code}` : ""}`}>
              View Case →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}