import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: TotalScribeLanding,
});

/* ------------------------------------------------------------------ */
/* TotalScribe — cinematic dark editorial landing page                */
/* ------------------------------------------------------------------ */

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function TotalScribeLanding() {
  const hydrated = useHydrated();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef<HTMLDivElement | null>(null);
  const lockWordRef = useRef<HTMLDivElement | null>(null);
  const lockBgRef = useRef<HTMLDivElement | null>(null);
  const horizontalRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const complianceRef = useRef<HTMLDivElement | null>(null);
  const complianceFillRef = useRef<HTMLSpanElement | null>(null);
  const showcaseRef = useRef<HTMLDivElement | null>(null);
  const mockupRef = useRef<HTMLDivElement | null>(null);
  const noteLinesRef = useRef<HTMLDivElement | null>(null);
  const ctaBtnRef = useRef<HTMLButtonElement | null>(null);

  // GSAP setup (client only)
  useEffect(() => {
    if (!hydrated) return;
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // HERO reveal
        const heroWords = heroRef.current?.querySelectorAll<HTMLElement>("[data-hero-word]");
        if (heroWords && heroWords.length) {
          gsap.set(heroWords, { yPercent: 110, opacity: 0, filter: "blur(18px)", scale: 1.05 });
          gsap.to(heroWords, {
            yPercent: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.09,
            delay: 0.15,
          });
        }
        gsap.to("[data-hero-sub]", { opacity: 1, y: 0, duration: 1, delay: 1.1, ease: "power3.out" });
        gsap.to("[data-hero-meta]", { opacity: 1, duration: 1, delay: 1.4 });

        // 2. SCROLL-LOCK "LISTENING..."
        if (lockRef.current && lockWordRef.current && lockBgRef.current) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: lockRef.current,
              start: "top top",
              end: "+=1600",
              pin: true,
              scrub: 1.2,
            },
          });
          tl.fromTo(
            lockWordRef.current,
            { scale: 0.35, opacity: 0.15, letterSpacing: "0.4em" },
            { scale: 1, opacity: 1, letterSpacing: "0.02em", ease: "power2.out" },
            0,
          );
          tl.fromTo(
            lockBgRef.current,
            { backgroundColor: "rgba(13,148,136,0)" },
            { backgroundColor: "rgba(0,242,254,0.08)", ease: "none" },
            0,
          );
          tl.to(
            lockWordRef.current,
            { color: "#00f2fe", ease: "none" },
            0,
          );
          tl.to(
            lockWordRef.current,
            { color: "#ffffff", ease: "none" },
            0.6,
          );
          tl.to("[data-lock-wave]", { scaleY: 1.6, ease: "sine.inOut" }, 0);
        }

        // 3. HORIZONTAL PIPELINE
        const isDesktop = window.matchMedia("(min-width: 900px)").matches;
        if (isDesktop && horizontalRef.current && trackRef.current) {
          const track = trackRef.current;
          const distance = () => track.scrollWidth - window.innerWidth;
          gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: horizontalRef.current,
              start: "top top",
              end: () => "+=" + distance(),
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });

          // parallax within each card
          gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
            const head = card.querySelector<HTMLElement>("[data-card-head]");
            const sub = card.querySelector<HTMLElement>("[data-card-sub]");
            const num = card.querySelector<HTMLElement>("[data-card-num]");
            if (head)
              gsap.to(head, {
                xPercent: -12,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: ScrollTrigger.getAll().find((t) => t.pin === horizontalRef.current)?.animation,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              });
            if (sub)
              gsap.to(sub, {
                xPercent: -4,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: ScrollTrigger.getAll().find((t) => t.pin === horizontalRef.current)?.animation,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              });
            if (num)
              gsap.to(num, {
                xPercent: -22,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: ScrollTrigger.getAll().find((t) => t.pin === horizontalRef.current)?.animation,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              });
          });
        }

        // 4. COMPLIANCE SCROLL FILL
        if (complianceRef.current && complianceFillRef.current) {
          gsap.fromTo(
            complianceFillRef.current,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              ease: "none",
              scrollTrigger: {
                trigger: complianceRef.current,
                start: "top 70%",
                end: "bottom 30%",
                scrub: true,
              },
            },
          );
        }

        // 5. MOCKUP UNROLL
        if (showcaseRef.current && mockupRef.current) {
          gsap.fromTo(
            mockupRef.current,
            { yPercent: 40, scale: 0.8, opacity: 0 },
            {
              yPercent: 0,
              scale: 1,
              opacity: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: showcaseRef.current,
                start: "top 75%",
                end: "center center",
                scrub: 1,
              },
            },
          );

          if (noteLinesRef.current) {
            const lines = noteLinesRef.current.querySelectorAll<HTMLElement>("[data-note-line]");
            gsap.fromTo(
              lines,
              { width: "0%", opacity: 0.2 },
              {
                width: "100%",
                opacity: 1,
                ease: "power2.out",
                stagger: 0.15,
                scrollTrigger: {
                  trigger: showcaseRef.current,
                  start: "top 40%",
                  end: "bottom bottom",
                  scrub: 1,
                },
              },
            );
          }
        }

        ScrollTrigger.refresh();
      }, rootRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [hydrated]);

  // Magnetic CTA button
  useEffect(() => {
    const btn = ctaBtnRef.current;
    if (!btn) return;
    let raf = 0;
    const strength = 0.35;
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      btn.style.transition = "transform 600ms cubic-bezier(.22,1.4,.36,1)";
      btn.style.transform = "translate(0,0)";
      setTimeout(() => (btn.style.transition = ""), 600);
    };
    btn.addEventListener("mousemove", onMove);
    btn.addEventListener("mouseleave", onLeave);
    return () => {
      btn.removeEventListener("mousemove", onMove);
      btn.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const heroLine1 = ["SPEECH", "TO", "SOAP."];
  const heroLine2 = ["INSTANTLY."];

  return (
    <div
      ref={rootRef}
      className="bg-ts-bg text-ts-ink font-display selection:bg-ts-teal selection:text-black"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 md:px-10 h-16">
          <div className="flex items-center gap-2 font-black tracking-tight text-lg">
            <span className="inline-block w-2 h-2 rounded-full bg-ts-teal shadow-[0_0_18px_rgba(0,242,254,0.9)]" />
            TOTAL<span className="text-ts-teal">SCRIBE</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-white/60 font-mono" style={{ fontFamily: "var(--font-mono)" }}>
            <a href="#pipeline" className="hover:text-white transition">Pipeline</a>
            <a href="#compliance" className="hover:text-white transition">Compliance</a>
            <a href="#product" className="hover:text-white transition">Product</a>
            <a href="#cta" className="hover:text-white transition">Contact</a>
          </nav>
          <a href="#cta" className="text-xs uppercase tracking-[0.2em] font-mono border border-white/20 hover:border-ts-teal hover:text-ts-teal px-4 py-2 rounded-full transition" style={{ fontFamily: "var(--font-mono)" }}>
            Request access →
          </a>
        </div>
      </header>

      {/* 1. HERO */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-end overflow-hidden ts-grid-bg"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,242,254,0.08),transparent_60%)]" />
        <div className="absolute inset-0 ts-noise-overlay" />
        <div className="relative max-w-[1600px] mx-auto w-full px-6 md:px-10 pb-16 md:pb-24 pt-32">
          <div
            data-hero-meta
            className="opacity-0 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/50 mb-10 font-mono"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="w-8 h-px bg-ts-teal" />
            <span>v1.0 · Agentic Clinical Intelligence</span>
          </div>

          <h1 className="font-black leading-[0.85] tracking-[-0.04em] text-[16vw] md:text-[13vw] lg:text-[11vw]">
            <span className="block overflow-hidden">
              {heroLine1.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pr-[0.15em] align-top">
                  <span data-hero-word className="inline-block will-change-transform">
                    {w}
                  </span>
                </span>
              ))}
            </span>
            <span className="block overflow-hidden">
              {heroLine2.map((w, i) => (
                <span key={i} className="inline-block overflow-hidden pr-[0.15em] align-top text-ts-teal">
                  <span data-hero-word className="inline-block will-change-transform">
                    {w}
                  </span>
                </span>
              ))}
            </span>
          </h1>

          <div className="mt-10 grid md:grid-cols-3 gap-10 items-end">
            <p
              data-hero-sub
              className="opacity-0 translate-y-6 md:col-span-2 text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed"
            >
              TotalScribe listens to the patient encounter, thinks like a clinician,
              and hands back a structured, HIPAA-ready SOAP note — in seconds, not shifts.
            </p>
            <div
              className="flex items-center gap-6 text-xs font-mono uppercase tracking-[0.25em] text-white/40"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-ts-teal">●</span> Live · 4.2s avg latency
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/40 font-mono"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          scroll ↓
        </div>
      </section>

      {/* 2. SCROLL LOCK — LISTENING */}
      <section
        ref={lockRef}
        className="relative h-screen w-full overflow-hidden"
      >
        <div ref={lockBgRef} className="absolute inset-0" />
        <div className="absolute inset-0 ts-grid-bg opacity-30" />
        <div className="relative h-full w-full flex flex-col items-center justify-center">
          <div className="flex items-end gap-[6px] mb-16 h-24" data-lock-wave>
            {Array.from({ length: 28 }).map((_, i) => {
              const h = 20 + Math.abs(Math.sin(i * 0.6)) * 70;
              return (
                <span
                  key={i}
                  className="w-[3px] bg-ts-teal/80 rounded-full"
                  style={{ height: `${h}%`, opacity: 0.35 + (i % 5) * 0.12 }}
                />
              );
            })}
          </div>
          <div
            ref={lockWordRef}
            className="font-black tracking-[-0.05em] text-[18vw] md:text-[14vw] leading-none text-white will-change-transform"
          >
            LISTENING<span className="text-ts-teal">.</span>
          </div>
          <p
            className="mt-10 text-xs md:text-sm uppercase tracking-[0.4em] text-white/50 font-mono"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Real-time streaming · Whisper-optimized · End-to-end encrypted
          </p>
        </div>
      </section>

      {/* 3. HORIZONTAL PIPELINE */}
      <section
        id="pipeline"
        ref={horizontalRef}
        className="relative h-screen w-full overflow-hidden bg-black"
      >
        <div className="absolute top-8 left-6 md:left-10 z-10 text-xs uppercase tracking-[0.35em] text-white/40 font-mono" style={{ fontFamily: "var(--font-mono)" }}>
          <span className="text-ts-teal">◆</span> The Agentic Pipeline
        </div>

        {/* horizontal track (desktop) / stacked (mobile) */}
        <div
          ref={trackRef}
          className="h-full flex flex-col md:flex-row md:w-[300vw] will-change-transform"
        >
          {[
            {
              n: "01",
              icon: "🎙️",
              title: "WHISPER TRANSCRIBE",
              sub: "Convert patient encounter recordings to text using optimized, medically tuned speech-to-text engines. Multi-speaker, noise-resilient, sub-second streaming.",
              tone: "text-white",
            },
            {
              n: "02",
              icon: "🤖",
              title: "AGENTIC REASONING",
              sub: "Autonomous AI agents that think, analyze, and generate like medical experts — chaining specialist models for symptoms, differentials, plans, and coding.",
              tone: "text-ts-teal",
            },
            {
              n: "03",
              icon: "📝",
              title: "THE SOAP OUTPUT",
              sub: "Structured, flawless clinical notes instantly populated into the EMR workflow. Subjective, objective, assessment, plan — signed, tagged, and shipped.",
              tone: "text-white",
            },
          ].map((c) => (
            <div
              key={c.n}
              data-card
              className="relative w-full md:w-screen h-screen flex-shrink-0 flex items-center px-6 md:px-24 border-t md:border-t-0 md:border-l border-white/5"
            >
              <div
                data-card-num
                className="absolute -top-4 md:top-1/2 md:-translate-y-1/2 right-6 md:right-24 text-[28vw] md:text-[22vw] font-black text-white/[0.04] leading-none pointer-events-none select-none"
              >
                {c.n}
              </div>
              <div className="relative max-w-3xl">
                <div className="text-xs uppercase tracking-[0.35em] text-ts-teal font-mono mb-6" style={{ fontFamily: "var(--font-mono)" }}>
                  Step {c.n} · {c.icon}
                </div>
                <h3
                  data-card-head
                  className={`font-black leading-[0.9] tracking-[-0.04em] text-[12vw] md:text-[8vw] ${c.tone}`}
                >
                  {c.title}
                </h3>
                <p
                  data-card-sub
                  className="mt-8 text-white/60 text-base md:text-xl max-w-xl leading-relaxed"
                >
                  {c.sub}
                </p>
                <div
                  className="mt-10 flex items-center gap-6 text-[10px] uppercase tracking-[0.35em] text-white/40 font-mono"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span>Latency</span>
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-ts-teal">
                    {c.n === "01" ? "180ms" : c.n === "02" ? "1.8s" : "220ms"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMPLIANCE FILL */}
      <section
        id="compliance"
        ref={complianceRef}
        className="relative min-h-[90vh] flex items-center px-6 md:px-10 py-32"
      >
        <div className="max-w-[1600px] mx-auto w-full">
          <div
            className="text-xs uppercase tracking-[0.35em] text-white/40 font-mono mb-10"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-ts-teal">◆</span> Trust layer
          </div>
          <h2 className="relative font-black leading-[0.9] tracking-[-0.04em] text-[14vw] md:text-[10vw]">
            <span className="text-white/12" style={{ color: "rgba(255,255,255,0.12)" }}>
              SECURE. COMPLIANT.
              <br />
              HIPAA-READY.
            </span>
            <span
              ref={complianceFillRef}
              aria-hidden
              className="absolute inset-0 text-white"
              style={{ clipPath: "inset(0 100% 0 0)" }}
            >
              SECURE. COMPLIANT.
              <br />
              HIPAA-READY.
            </span>
          </h2>

          <div className="mt-16 grid md:grid-cols-3 gap-10 border-t border-white/10 pt-10">
            {[
              ["SOC 2 · Type II", "Independently audited controls end-to-end."],
              ["HIPAA · BAA", "Signed Business Associate Agreements included."],
              ["Zero-Retention", "Audio purged post-transcription. Notes stay yours."],
            ].map(([t, d]) => (
              <div key={t}>
                <div
                  className="text-ts-teal text-xs uppercase tracking-[0.35em] font-mono mb-3"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {t}
                </div>
                <p className="text-white/70 text-base leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MOCKUP SHOWCASE */}
      <section
        id="product"
        ref={showcaseRef}
        className="relative min-h-screen overflow-hidden px-6 md:px-10 py-32 border-t border-white/5"
      >
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <div
                className="text-xs uppercase tracking-[0.35em] text-white/40 font-mono mb-6"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span className="text-ts-teal">◆</span> The interface
              </div>
              <h2 className="font-black leading-[0.9] tracking-[-0.04em] text-6xl md:text-8xl max-w-3xl">
                A note<br />that writes itself.
              </h2>
            </div>
            <p className="text-white/60 max-w-md text-base md:text-lg">
              Watch structure emerge from speech in real time. No templates. No dictation macros.
              Just clinical clarity.
            </p>
          </div>

          <div
            ref={mockupRef}
            className="relative mx-auto max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] shadow-[0_50px_120px_-20px_rgba(0,242,254,0.15)] overflow-hidden will-change-transform"
          >
            {/* mockup chrome */}
            <div className="flex items-center gap-2 px-5 h-11 border-b border-white/10 bg-black/40">
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-ts-teal/70" />
              <div
                className="ml-6 text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                totalscribe.app / encounter · 24-081
              </div>
              <div
                className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ts-teal font-mono"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-ts-teal animate-pulse" /> Live
              </div>
            </div>

            <div className="grid md:grid-cols-[240px_1fr] min-h-[520px]">
              {/* sidebar */}
              <aside className="border-r border-white/10 p-5 hidden md:block bg-black/20">
                <div
                  className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-4 font-mono"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Encounters
                </div>
                {["Chen, W. — 32F", "Alvarez, R. — 58M", "Okafor, T. — 41F", "Patel, N. — 27M"].map((n, i) => (
                  <div
                    key={n}
                    className={`text-sm py-2 border-b border-white/5 ${i === 0 ? "text-ts-teal" : "text-white/60"}`}
                  >
                    {n}
                  </div>
                ))}
              </aside>

              {/* note area */}
              <div ref={noteLinesRef} className="p-6 md:p-10 space-y-8">
                {[
                  { label: "S — Subjective", lines: ["Pt reports 3-day hx of substernal chest pressure, worse w/ exertion.", "Denies radiation, diaphoresis. Mild SOB on stairs."] },
                  { label: "O — Objective", lines: ["BP 132/84 · HR 78 · RR 16 · SpO₂ 98% RA.", "Lungs CTA b/l. Regular rate & rhythm. No pedal edema."] },
                  { label: "A — Assessment", lines: ["Likely stable angina vs. non-cardiac chest pain.", "R/O acute coronary syndrome given risk profile."] },
                  { label: "P — Plan", lines: ["ECG in-office, high-sensitivity troponin.", "Refer cardiology for stress testing within 72h."] },
                ].map((sec) => (
                  <div key={sec.label}>
                    <div
                      className="text-[10px] uppercase tracking-[0.35em] text-ts-teal mb-3 font-mono"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {sec.label}
                    </div>
                    <div className="space-y-2">
                      {sec.lines.map((l, i) => (
                        <div
                          key={i}
                          data-note-line
                          className="text-white/85 text-sm md:text-base leading-relaxed whitespace-nowrap overflow-hidden"
                          style={{ width: "0%" }}
                        >
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section
        id="cta"
        className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-32 border-t border-white/5 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,242,254,0.12),transparent_60%)]" />
        <div
          className="relative text-xs uppercase tracking-[0.35em] text-white/40 mb-8 font-mono"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-ts-teal">◆</span> Take the next step
        </div>
        <h2 className="relative font-black leading-[0.85] tracking-[-0.05em] text-[16vw] md:text-[12vw]">
          TRANSFORM<br />
          <span className="text-ts-teal">YOUR CLINICS.</span>
        </h2>
        <p className="relative mt-8 text-white/60 max-w-xl text-lg">
          Join the clinics reclaiming hours per day with agentic clinical intelligence.
        </p>
        <div className="relative mt-14">
          <button
            ref={ctaBtnRef}
            className="group relative inline-flex items-center gap-4 rounded-full bg-ts-teal text-black font-black uppercase tracking-[0.15em] text-sm md:text-base px-10 py-6 shadow-[0_20px_60px_-10px_rgba(0,242,254,0.5)] hover:shadow-[0_30px_90px_-10px_rgba(0,242,254,0.7)] will-change-transform"
          >
            Request early access
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <div
          className="relative mt-24 flex items-center gap-6 text-[10px] uppercase tracking-[0.35em] text-white/30 font-mono"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>© {new Date().getFullYear()} TotalScribe</span>
          <span className="w-px h-3 bg-white/20" />
          <span>Built for clinicians</span>
        </div>
      </section>
    </div>
  );
}
}
