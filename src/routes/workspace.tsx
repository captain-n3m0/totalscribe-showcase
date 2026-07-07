import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — TotalScribe" },
      { name: "description", content: "Capture audio, watch agentic AI transcribe and structure SOAP notes in real time." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkspacePage,
});

type Phase = "IDLE" | "UPLOADING" | "TRANSCRIBING" | "ALIGNING" | "SYNTHESIZING" | "COMPLETED";

const STEPS: { id: Exclude<Phase, "IDLE" | "UPLOADING" | "COMPLETED">; label: string; sub: string; icon: string }[] = [
  { id: "TRANSCRIBING", label: "Whisper-v3 // Speech-to-Text", sub: "Parsing raw acoustic signal into tokens", icon: "◐" },
  { id: "ALIGNING",     label: "Clinical Context Alignment", sub: "Extracting symptoms, history, findings", icon: "◇" },
  { id: "SYNTHESIZING", label: "Mistral-7B // SOAP Synthesis", sub: "Structuring Subjective · Objective · Assessment · Plan", icon: "◈" },
];

const RAW_TRANSCRIPT = [
  "PT: uh so, the chest pain started maybe three days ago…",
  "DR: sharp or dull? radiating anywhere?",
  "PT: kinda sharp, worse when i breathe in. no radiation.",
  "DR: any fever, cough, recent travel?",
  "PT: mild fever last night, dry cough for a week.",
  "DR: okay. i'll listen to your lungs, take vitals.",
  "DR: BP 128 over 82, HR 92, temp 38.1, SpO2 97 on room air.",
  "DR: decreased breath sounds right lower lobe, no wheeze.",
];

const SOAP = {
  S: "34F presents with 3 days of pleuritic right-sided chest pain, associated dry cough x1 week and low-grade fever (Tmax 38.1°C). Denies radiation, hemoptysis, recent travel, or sick contacts. No known cardiopulmonary history.",
  O: "VS: BP 128/82 · HR 92 · T 38.1°C · SpO₂ 97% RA · RR 18.\nGen: alert, non-toxic. Chest: decreased breath sounds RLL, no wheeze/rhonchi. CV: RRR, no murmur. Abd: soft, NT.",
  A: "1. Community-acquired pneumonia, right lower lobe — most likely.\n2. Pleuritic chest pain, secondary to (1).\n3. Rule out pulmonary embolism (low pretest probability, Wells 0).",
  P: "· CXR PA/lat, CBC, CMP, CRP.\n· Empiric amoxicillin 1 g PO TID x 5 days.\n· Acetaminophen 650 mg PRN fever/pain.\n· Return precautions: worsening dyspnea, hemoptysis, syncope.\n· F/U in 72 hours or sooner.",
};

type Encounter = { id: string; initials: string; time: string; status: "Completed" | "Processing" | "Failed" };
const RECENT: Encounter[] = [
  { id: "e1", initials: "J.M.", time: "09:12", status: "Completed" },
  { id: "e2", initials: "A.K.", time: "10:03", status: "Completed" },
  { id: "e3", initials: "R.P.", time: "10:44", status: "Failed" },
  { id: "e4", initials: "S.L.", time: "11:20", status: "Processing" },
];

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function WorkspacePage() {
  const hydrated = useHydrated();
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [dragOver, setDragOver] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const [revealedSoap, setRevealedSoap] = useState<Record<"S" | "O" | "A" | "P", string>>({ S: "", O: "", A: "", P: "" });
  const [fileName, setFileName] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const pipelineRef = useRef<HTMLDivElement | null>(null);

  const activeStepIndex = useMemo(() => {
    if (phase === "TRANSCRIBING") return 0;
    if (phase === "ALIGNING") return 1;
    if (phase === "SYNTHESIZING") return 2;
    if (phase === "COMPLETED") return 3;
    return -1;
  }, [phase]);

  // GSAP entrance + phase-driven animations
  useEffect(() => {
    if (!hydrated) return;
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.default ?? gsapMod;
      ctx = gsap.context(() => {
        gsap.from("[data-panel]", { y: 24, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 });
        gsap.from("[data-topbar]", { y: -20, opacity: 0, duration: 0.5, ease: "power2.out" });
      }, rootRef);
    })();
    return () => { cancelled = true; ctx?.revert(); };
  }, [hydrated]);

  // Pulse dropzone during UPLOADING
  useEffect(() => {
    if (!hydrated || !dropRef.current) return;
    let tween: { kill: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.default ?? gsapMod;
      if (phase === "UPLOADING") {
        tween = gsap.to(dropRef.current, {
          boxShadow: "0 0 0 2px rgba(0,242,254,0.9), 0 0 40px rgba(0,242,254,0.35)",
          repeat: -1, yoyo: true, duration: 0.7, ease: "sine.inOut",
        });
      } else {
        gsap.set(dropRef.current, { clearProps: "boxShadow" });
      }
    })();
    return () => { cancelled = true; tween?.kill(); };
  }, [phase, hydrated]);

  // Animate pipeline step reveals
  useEffect(() => {
    if (!hydrated || !pipelineRef.current) return;
    let cancelled = false;
    (async () => {
      const gsapMod = await import("gsap");
      if (cancelled) return;
      const gsap = gsapMod.default ?? gsapMod;
      const nodes = pipelineRef.current!.querySelectorAll<HTMLElement>("[data-step]");
      nodes.forEach((n, i) => {
        if (i <= activeStepIndex) {
          gsap.to(n, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
        }
      });
    })();
    return () => { cancelled = true; };
  }, [activeStepIndex, hydrated]);

  // Phase state machine (simulated pipeline)
  useEffect(() => {
    if (phase === "IDLE" || phase === "COMPLETED") return;
    const timers: number[] = [];

    if (phase === "UPLOADING") {
      timers.push(window.setTimeout(() => setPhase("TRANSCRIBING"), 900));
    }

    if (phase === "TRANSCRIBING") {
      setTranscriptLines([]);
      RAW_TRANSCRIPT.forEach((line, i) => {
        timers.push(window.setTimeout(() => setTranscriptLines((prev) => [...prev, line]), 250 + i * 260));
      });
      timers.push(window.setTimeout(() => setPhase("ALIGNING"), 250 + RAW_TRANSCRIPT.length * 260 + 300));
    }

    if (phase === "ALIGNING") {
      timers.push(window.setTimeout(() => setPhase("SYNTHESIZING"), 1400));
    }

    if (phase === "SYNTHESIZING") {
      // Cascade SOAP sections with a typing effect
      const sections: ("S" | "O" | "A" | "P")[] = ["S", "O", "A", "P"];
      setRevealedSoap({ S: "", O: "", A: "", P: "" });
      let cursor = 400;
      sections.forEach((sec) => {
        const full = SOAP[sec];
        const chunkSize = Math.max(2, Math.round(full.length / 40));
        for (let i = chunkSize; i <= full.length; i += chunkSize) {
          const slice = full.slice(0, i);
          timers.push(window.setTimeout(() => setRevealedSoap((p) => ({ ...p, [sec]: slice })), cursor));
          cursor += 22;
        }
        timers.push(window.setTimeout(() => setRevealedSoap((p) => ({ ...p, [sec]: full })), cursor));
        cursor += 220;
      });
      timers.push(window.setTimeout(() => setPhase("COMPLETED"), cursor + 100));
    }

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const startEncounter = (name?: string) => {
    setFileName(name ?? "live-mic.wav");
    setRevealedSoap({ S: "", O: "", A: "", P: "" });
    setTranscriptLines([]);
    setPhase("UPLOADING");
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) startEncounter(f.name);
  };

  const isActive = phase !== "IDLE" && phase !== "COMPLETED";

  return (
    <div
      ref={rootRef}
      className="h-screen w-screen overflow-hidden bg-black text-white flex flex-col"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <TopBar phase={phase} fileName={fileName} />

      <div className="flex-1 grid grid-cols-12 gap-px bg-[#1a1a1a] overflow-hidden">
        {/* LEFT — Capture */}
        <section data-panel className="col-span-12 md:col-span-3 bg-[#0A0A0A] flex flex-col overflow-hidden">
          <PanelHeader eyebrow="01 / CAPTURE" title="Encounter" />
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            <button
              onClick={() => startEncounter()}
              disabled={isActive}
              className="group relative w-full rounded-md bg-[#00F2FE] text-black font-black tracking-tight text-sm py-3 px-4 uppercase disabled:opacity-40 disabled:cursor-not-allowed transition hover:brightness-110"
            >
              + New Encounter
            </button>

            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`rounded-md border border-dashed p-4 text-center text-xs transition-colors ${
                dragOver ? "border-[#00F2FE] bg-[#00f2fe]/5" : "border-[#1F1F1F] bg-black/40"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <div className="text-white/50">Drop MP3 / WAV</div>
              <div className="mt-1 text-white/30">or click New Encounter</div>
            </div>

            <Waveform active={isActive} />

            <div>
              <div
                className="text-[10px] tracking-[0.25em] text-white/40 mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                RECENT · TODAY
              </div>
              <ul className="flex flex-col gap-1">
                {RECENT.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between px-3 py-2 rounded border border-transparent hover:border-[#1F1F1F] hover:bg-black/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#111] border border-[#1F1F1F] grid place-items-center text-xs font-bold">
                        {e.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{e.initials}</div>
                        <div className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{e.time}</div>
                      </div>
                    </div>
                    <StatusBadge status={e.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* MIDDLE — Agentic Pipeline */}
        <section data-panel className="col-span-12 md:col-span-4 bg-[#070707] flex flex-col overflow-hidden">
          <PanelHeader
            eyebrow="02 / AGENTIC AI"
            title="AI_AGENT_PIPELINE"
            trailing={
              <span
                className={`text-[10px] tracking-[0.25em] px-2 py-1 rounded border ${
                  isActive ? "border-[#00F2FE] text-[#00F2FE]" : "border-white/10 text-white/40"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {isActive ? "// ACTIVE" : "// IDLE"}
              </span>
            }
          />
          <div ref={pipelineRef} className="flex-1 overflow-y-auto px-6 py-5">
            <ol className="relative pl-6 border-l border-[#1A1A1A]">
              {STEPS.map((s, i) => {
                const state = i < activeStepIndex ? "done" : i === activeStepIndex ? "active" : "pending";
                const initial = i === 0 ? { x: 0, opacity: 1 } : { x: 16, opacity: 0 };
                return (
                  <li
                    key={s.id}
                    data-step
                    style={initial as React.CSSProperties}
                    className="relative mb-6 last:mb-0"
                  >
                    <StepDot state={state} />
                    <div className="pl-3">
                      <div className="text-[10px] tracking-[0.25em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                        STEP 0{i + 1}
                      </div>
                      <div className="text-lg font-black tracking-tight mt-0.5">{s.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{s.sub}</div>

                      {i === 0 && (transcriptLines.length > 0 || state !== "pending") && (
                        <TranscriptStream lines={transcriptLines} />
                      )}
                      {i === 1 && state !== "pending" && <AlignmentChips active={state === "active"} />}
                      {i === 2 && state !== "pending" && (
                        <div
                          className="mt-3 text-[11px] text-[#00F2FE]/80"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {state === "active" ? "▍ generating S · O · A · P …" : "✓ soap synthesized"}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {phase === "IDLE" && (
              <div
                className="mt-6 text-[11px] text-white/30"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                waiting for encounter…
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — SOAP Editor */}
        <section data-panel className="col-span-12 md:col-span-5 bg-[#0A0A0A] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] px-6 py-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
                03 / OUTPUT
              </div>
              <div className="text-xl font-black tracking-tight">FINAL CLINICAL NOTE</div>
            </div>
            <div className="flex items-center gap-2">
              <UtilButton>Copy</UtilButton>
              <UtilButton>Export EHR</UtilButton>
              <UtilButton
                onClick={() => phase === "COMPLETED" && startEncounter(fileName ?? undefined)}
                accent
              >
                Regenerate
              </UtilButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {phase === "IDLE" ? (
              <EmptyNote />
            ) : (
              <article className="max-w-2xl mx-auto">
                <NoteHeader fileName={fileName} phase={phase} />
                <SoapSection letter="S" title="Subjective" body={revealedSoap.S} />
                <SoapSection letter="O" title="Objective" body={revealedSoap.O} />
                <SoapSection letter="A" title="Assessment" body={revealedSoap.A} />
                <SoapSection letter="P" title="Plan" body={revealedSoap.P} />
              </article>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------- sub-components -------------------- */

function TopBar({ phase, fileName }: { phase: Phase; fileName: string | null }) {
  return (
    <div
      data-topbar
      className="flex items-center justify-between px-6 py-3 border-b border-[#1A1A1A] bg-black"
    >
      <div className="flex items-center gap-4">
        <div className="text-lg font-black tracking-tight">
          TOTAL<span className="text-[#00F2FE]">SCRIBE</span>
        </div>
        <span className="text-white/20">/</span>
        <div className="text-xs text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
          workspace
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-[10px] tracking-[0.25em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
          {fileName ? `FILE · ${fileName}` : "NO FILE LOADED"}
        </div>
        <PhaseIndicator phase={phase} />
        <div className="h-8 w-8 rounded-full bg-[#111] border border-[#1F1F1F] grid place-items-center text-[11px] font-bold">
          DR
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  const color =
    phase === "COMPLETED" ? "text-[#00F2FE] border-[#00F2FE]" :
    phase === "IDLE"      ? "text-white/40 border-white/10" :
                            "text-[#00F2FE] border-[#00F2FE]/60";
  return (
    <span
      className={`text-[10px] tracking-[0.25em] px-2 py-1 rounded border ${color}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {phase}
    </span>
  );
}

function PanelHeader({
  eyebrow, title, trailing,
}: { eyebrow: string; title: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between border-b border-[#1A1A1A] px-6 py-4">
      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
          {eyebrow}
        </div>
        <div className="text-xl font-black tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
          {title}
        </div>
      </div>
      {trailing}
    </div>
  );
}

function StatusBadge({ status }: { status: Encounter["status"] }) {
  const map = {
    Completed:  "border-[#00F2FE]/50 text-[#00F2FE]",
    Processing: "border-yellow-400/40 text-yellow-300",
    Failed:     "border-red-500/40 text-red-400",
  } as const;
  return (
    <span
      className={`text-[9px] tracking-[0.2em] px-2 py-0.5 rounded border ${map[status]}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function StepDot({ state }: { state: "pending" | "active" | "done" }) {
  if (state === "done") {
    return (
      <span className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-[#00F2FE] text-black grid place-items-center text-xs font-black">
        ✓
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="absolute -left-[13px] top-1 h-6 w-6 rounded-full border-2 border-[#00F2FE] border-t-transparent animate-spin" />
    );
  }
  return (
    <span className="absolute -left-[9px] top-2 h-3 w-3 rounded-full border border-white/20 bg-black" />
  );
}

function TranscriptStream({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div
      ref={ref}
      className="mt-3 h-32 overflow-y-auto rounded border border-[#1A1A1A] bg-black/60 p-3 text-[11px] leading-relaxed text-white/70"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {lines.length === 0 ? (
        <span className="text-white/30">▍ awaiting audio stream…</span>
      ) : (
        lines.map((l, i) => (
          <div key={i}>
            <span className="text-[#00F2FE]/70">›</span> {l}
          </div>
        ))
      )}
    </div>
  );
}

function AlignmentChips({ active }: { active: boolean }) {
  const chips = ["chest pain · pleuritic", "cough · 1 wk", "fever · Tmax 38.1", "SpO₂ 97% RA", "no travel", "no radiation"];
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span
          key={c}
          className={`text-[10px] px-2 py-1 rounded border ${
            active ? "border-[#00F2FE]/40 text-[#00F2FE]" : "border-white/10 text-white/60"
          }`}
          style={{ fontFamily: "var(--font-mono)", animationDelay: `${i * 60}ms` }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function UtilButton({
  children, onClick, accent,
}: { children: React.ReactNode; onClick?: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] tracking-[0.2em] uppercase px-3 py-1.5 rounded border transition ${
        accent
          ? "border-[#00F2FE] text-[#00F2FE] hover:bg-[#00F2FE] hover:text-black"
          : "border-[#1F1F1F] text-white/70 hover:border-white/40 hover:text-white"
      }`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </button>
  );
}

function NoteHeader({ fileName, phase }: { fileName: string | null; phase: Phase }) {
  return (
    <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4 mb-6">
      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
          ENCOUNTER · {new Date().toLocaleDateString()}
        </div>
        <h1 className="text-3xl font-black tracking-tight mt-1">Clinical Note</h1>
      </div>
      <div className="text-right text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
        <div>{fileName ?? "—"}</div>
        <div>{phase === "COMPLETED" ? "signed · draft" : "generating…"}</div>
      </div>
    </div>
  );
}

function SoapSection({ letter, title, body }: { letter: string; title: string; body: string }) {
  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-4xl font-black text-[#00F2FE] leading-none">{letter}</span>
        <span className="text-xs tracking-[0.3em] text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
          {title.toUpperCase()}
        </span>
      </div>
      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-white/85 min-h-[1.5em]">
        {body}
        {body.length > 0 && body.length < 400 && (
          <span className="inline-block w-2 h-4 -mb-0.5 ml-0.5 bg-[#00F2FE] animate-pulse" />
        )}
      </p>
    </section>
  );
}

function EmptyNote() {
  return (
    <div className="h-full grid place-items-center text-center">
      <div>
        <div className="text-[10px] tracking-[0.3em] text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
          NO NOTE
        </div>
        <h2 className="text-4xl font-black tracking-tight mt-2">Start an encounter</h2>
        <p className="text-sm text-white/50 mt-2 max-w-sm">
          Hit <span className="text-[#00F2FE]">New Encounter</span> or drop an audio file. TotalScribe drafts the SOAP note in seconds.
        </p>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => { setT((v) => v + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const bars = 32;
  return (
    <div className="rounded-md border border-[#1A1A1A] bg-black/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.25em] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
          {active ? "● REC" : "○ IDLE"}
        </span>
        <span className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>
          {active ? "00:04" : "00:00"}
        </span>
      </div>
      <svg viewBox="0 0 200 60" className="w-full h-14">
        {Array.from({ length: bars }).map((_, i) => {
          const base = active
            ? 8 + Math.abs(Math.sin((t + i * 7) * 0.12)) * 42 + Math.abs(Math.sin(i * 0.9)) * 6
            : 4 + (i % 3);
          const h = Math.min(56, base);
          const y = (60 - h) / 2;
          return (
            <rect
              key={i}
              x={i * (200 / bars) + 1}
              y={y}
              width={(200 / bars) - 2}
              height={h}
              rx={1}
              fill={active ? "#00F2FE" : "#1F1F1F"}
              opacity={active ? 0.6 + (i % 4) * 0.1 : 1}
            />
          );
        })}
      </svg>
    </div>
  );
}