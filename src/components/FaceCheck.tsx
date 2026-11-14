import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RotateCcw } from "lucide-react";
import { Alert, Button } from "@/components/ui";
import { Liveness, measure, randomSteps, stepText, type LivenessState, type Step } from "@/utils/face-pose";

// Verifikasi wajah pelaku budaya. Wajah diproses di perangkat pengguna dengan MediaPipe Face Landmarker
// (dimuat dari CDN saat dibutuhkan). Yang dikirim ke VAKSARA hanya satu foto posisi lurus dan hasil langkah.
const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks: { x: number; y: number }[][]; faceBlendshapes?: { categories: { categoryName: string; score: number }[] }[] }; close: () => void };

async function loadLandmarker(): Promise<Landmarker> {
  const vision = await import(/* @vite-ignore */ `${VISION}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
  const options = (delegate: "GPU" | "CPU") => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numFaces: 2, outputFaceBlendshapes: true });
  try { return await vision.FaceLandmarker.createFromOptions(fileset, options("GPU")); }
  catch { return await vision.FaceLandmarker.createFromOptions(fileset, options("CPU")); }
}

export type FaceResult = { photo: Blob; meta: { method: string; steps: Step[]; duration_ms: number; completed_at: string } };

export function FaceCheck({ onDone, onCancel }: { onDone: (r: FaceResult) => Promise<void>; onCancel: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"loading" | "running" | "saving" | "done" | "error">("loading");
  const [state, setState] = useState<LivenessState | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let stop = false, raf = 0, stream: MediaStream | null = null, landmarker: Landmarker | null = null, photo: Blob | null = null;
    const steps = randomSteps(), started = performance.now();
    const engine = new Liveness(steps, started);
    const snap = () => {
      const v = video.current; if (!v) return;
      const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      c.toBlob(b => { if (b) photo = b; }, "image/jpeg", 0.9);
    };
    const finish = async () => {
      setPhase("saving");
      stream?.getTracks().forEach(t => t.stop());
      for (let i = 0; i < 20 && !photo; i++) await new Promise(r => setTimeout(r, 50));
      if (!photo) { setError("Foto wajah tidak tersimpan. Ulangi verifikasi."); setPhase("error"); return; }
      try { await done.current({ photo, meta: { method: "mediapipe-face-landmarker@0.10.14 (di perangkat)", steps, duration_ms: Math.round(performance.now() - started), completed_at: new Date().toISOString() } }); if (!stop) setPhase("done"); }
      catch (e) { if (!stop) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); } }
    };
    const loop = () => {
      if (stop) return;
      const v = video.current;
      if (v && landmarker && v.readyState >= 2) {
        const r = landmarker.detectForVideo(v, performance.now());
        const st = engine.update(measure(r.faceLandmarks ?? [], r.faceBlendshapes?.[0]?.categories), performance.now());
        if (st.capture) snap();
        setState(st);
        if (st.failed) { setError(st.failed); setPhase("error"); stream?.getTracks().forEach(t => t.stop()); return; }
        if (st.done) { void finish(); return; }
      }
      raf = requestAnimationFrame(loop);
    };
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser ini tidak mendukung kamera. Gunakan Chrome atau Safari terbaru.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
          .catch(() => { throw new Error("Kamera tidak dapat dibuka. Izinkan akses kamera untuk vaksara.id di pengaturan browser, lalu coba lagi."); });
        if (stop) { stream.getTracks().forEach(t => t.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play().catch(() => undefined); }
        landmarker = await loadLandmarker().catch(() => { throw new Error("Pengenal wajah gagal dimuat. Periksa koneksi internet lalu coba lagi."); });
        if (stop) return;
        setPhase("running"); raf = requestAnimationFrame(loop);
      } catch (e) { if (!stop) { setError(e instanceof Error ? e.message : String(e)); setPhase("error"); } }
    })();
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); try { landmarker?.close(); } catch { /* abaikan */ } };
  }, [attempt]);

  const total = state?.total ?? 6, index = state?.index ?? 0;
  return <div className="space-y-3" aria-label="Verifikasi wajah">
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl bg-ink">
      <video ref={video} playsInline muted autoPlay className="h-full w-full -scale-x-100 object-cover" aria-label="Pratinjau kamera" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-[72%] w-[48%] rounded-[50%] border-4 border-white/70" /></div>
      {phase === "loading" && <div className="absolute inset-0 flex items-center justify-center bg-ink/70 text-sm text-cream">Menyiapkan kamera dan pengenal wajah…</div>}
      {phase === "saving" && <div className="absolute inset-0 flex items-center justify-center bg-ink/70 text-sm text-cream">Menyimpan hasil verifikasi…</div>}
      {phase === "done" && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1E5C38]/85 text-cream"><CheckCircle2 className="h-10 w-10" /><span className="font-semibold">Verifikasi wajah berhasil</span></div>}
    </div>
    {phase === "running" && state?.step && <div className="text-center" aria-live="polite">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">Langkah {Math.min(index + 1, total)} dari {total}</p>
      <p className="mt-1 font-display text-2xl text-ink">{stepText[state.step]}</p>
      <p className="mt-1 min-h-5 text-sm text-ink-soft">{state.message}</p>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={`h-2 w-6 rounded-full ${i < index ? "bg-[#2E7D4F]" : i === index ? "bg-sand" : "bg-line"}`} />)}</div>
    </div>}
    {phase === "error" && <Alert tone="error" title="Verifikasi belum berhasil">{error}</Alert>}
    <div className="flex flex-wrap justify-center gap-2">
      {phase === "error" && <Button size="sm" leading={<RotateCcw className="h-4 w-4" />} onClick={() => { setError(""); setState(null); setPhase("loading"); setAttempt(a => a + 1); }}>Ulangi</Button>}
      {phase !== "saving" && <Button size="sm" variant="secondary" onClick={onCancel}>{phase === "done" ? "Tutup" : "Batal"}</Button>}
    </div>
  </div>;
}

export function FaceCheckIntro({ onStart }: { onStart: () => void }) {
  const [agree, setAgree] = useState(false);
  return <div className="space-y-3">
    <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
      <li>Gunakan tempat yang cukup terang, lepas kacamata hitam atau masker.</li>
      <li>Ikuti 6 petunjuk singkat: lihat lurus, toleh kiri dan kanan, senyum, lihat atas dan bawah. Urutannya acak.</li>
      <li>Wajah diproses di perangkat Anda. VAKSARA hanya menyimpan <b>satu foto wajah</b> dan hasil verifikasi, yang hanya dapat dilihat peninjau untuk dicocokkan dengan KTP.</li>
    </ul>
    <label className="flex items-start gap-2 text-[13px] text-ink-soft"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#123a33]" checked={agree} onChange={e => setAgree(e.target.checked)} aria-label="Persetujuan foto wajah" /><span>Saya setuju foto wajah saya diambil dan disimpan VAKSARA untuk verifikasi identitas pelaku budaya, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Saya dapat meminta penghapusannya kapan saja. <a href="#/privasi" target="_blank" rel="noopener" className="font-semibold text-ink underline">Kebijakan privasi</a>.</span></label>
    <Button disabled={!agree} leading={<Camera className="h-4 w-4" />} onClick={onStart}>Mulai verifikasi wajah</Button>
  </div>;
}
