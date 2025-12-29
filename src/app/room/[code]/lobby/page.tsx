"use client";

import { useParams } from "next/navigation";

export default function LobbyPage() {
  const params = useParams<{ code: string }>();

  return (
    <div style={{ padding: 40 }}>
      <h1>Lobby</h1>
      <p>Room code: {params.code}</p>
    </div>
  );
}
