import GameClient from "./gameclient";

export default async function GamePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const safeCode = (code || "").trim().toUpperCase();

  return <GameClient code={safeCode} />;
}