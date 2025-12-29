import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Agency</h1>
      <p>
        <Link href="/agency/join">Join a session</Link>
      </p>
    </main>
  );
}