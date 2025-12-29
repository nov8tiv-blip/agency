"use client";

export default function JoinClient({ code }: { code: string }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Join Room</h1>
      <p>Room code: <b>{code}</b></p>
    </div>
  );
}