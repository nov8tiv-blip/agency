import LobbyClient from "./LobbyClient";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const safeCode = (code || "").trim().toUpperCase();

  return <LobbyClient code={safeCode} />;
}  