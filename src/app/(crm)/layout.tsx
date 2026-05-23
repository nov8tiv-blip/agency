import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <TopBar />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            background: "var(--hs-gray-light)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
