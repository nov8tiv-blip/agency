"use client";

import { useEffect, useState, useRef, use } from "react";

interface Proposal {
  id: string;
  title: string;
  recipientEmail?: string;
  total: number;
  status: string;
  lineItems: { id: string; name: string; quantity: number; unitPrice: number; total: number }[];
}

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    fetch(`/api/proposals/public/${token}`)
      .then((r) => r.json())
      .then((d) => { setProposal(d); setLoading(false); });
  }, [token]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#33475b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => { drawing.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    if (!signerName.trim()) { alert("Please enter your name"); return; }
    const canvas = canvasRef.current!;
    const signatureDataUrl = canvas.toDataURL("image/png");
    setSigning(true);

    const res = await fetch(`/api/proposals/${proposal!.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signatureName: signerName, signatureDataUrl }),
    });

    if (res.ok) {
      setSigned(true);
    } else {
      alert("Signing failed. Please try again.");
    }
    setSigning(false);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 64, fontFamily: "sans-serif" }}>Loading...</div>;
  if (!proposal) return <div style={{ padding: 64, textAlign: "center", fontFamily: "sans-serif" }}>Proposal not found</div>;

  if (signed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f8fa", fontFamily: "sans-serif" }}>
        <div style={{ background: "white", borderRadius: 12, padding: 48, textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ color: "#00bda5", margin: "0 0 12px" }}>Proposal Signed!</h1>
          <p style={{ color: "#516f90" }}>Thank you, {signerName}. Your signature has been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f8fa", fontFamily: "sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 12, padding: 40, marginBottom: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
          <div style={{ borderBottom: "3px solid #ff7a59", paddingBottom: 20, marginBottom: 28 }}>
            <h1 style={{ color: "#ff7a59", margin: "0 0 4px", fontSize: 28 }}>Agency CRM</h1>
            <h2 style={{ margin: 0, color: "#2d3e50", fontSize: 20 }}>{proposal.title}</h2>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e8eb" }}>
                {["Item", "Qty", "Unit Price", "Total"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: h === "Item" ? "left" : "right", fontSize: 12, color: "#516f90", fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposal.lineItems.map((li) => (
                <tr key={li.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px", fontWeight: 600 }}>{li.name}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>{li.quantity}</td>
                  <td style={{ padding: "10px", textAlign: "right" }}>${Number(li.unitPrice).toLocaleString()}</td>
                  <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>${Number(li.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: "right", fontSize: 20, fontWeight: 800, color: "#2d3e50" }}>
            Total: <span style={{ color: "#ff7a59" }}>${Number(proposal.total).toLocaleString()}</span>
          </div>
        </div>

        {proposal.status !== "SIGNED" && (
          <div style={{ background: "white", borderRadius: 12, padding: 40, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 20px", color: "#2d3e50" }}>Sign this Proposal</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Type your full name"
                style={{ width: "100%", border: "1px solid #e5e8eb", borderRadius: 6, padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700 }}>Signature</label>
                <button onClick={clearSignature} style={{ background: "none", border: "none", color: "#516f90", cursor: "pointer", fontSize: 13 }}>Clear</button>
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={140}
                style={{ border: "2px solid #e5e8eb", borderRadius: 6, cursor: "crosshair", touchAction: "none", width: "100%" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <button
              onClick={handleSign}
              disabled={signing}
              style={{ width: "100%", background: "#ff7a59", color: "white", border: "none", borderRadius: 8, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 20 }}
            >
              {signing ? "Signing..." : "Sign & Accept Proposal"}
            </button>
          </div>
        )}

        {proposal.status === "SIGNED" && (
          <div style={{ background: "#d5f5e3", borderRadius: 12, padding: 24, textAlign: "center" }}>
            <strong style={{ color: "#00875a" }}>This proposal has already been signed.</strong>
          </div>
        )}
      </div>
    </div>
  );
}
