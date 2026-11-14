// Logika verifikasi wajah (liveness) tanpa ketergantungan kamera atau model, agar dapat diuji.
// Masukan: titik wajah dari MediaPipe Face Landmarker (koordinat 0–1) dan skor ekspresi (blendshape).

export type Landmark = { x: number; y: number; z?: number };
export type Blendshape = { categoryName: string; score: number };
export type Sample = { faces: number; yaw: number; pitch: number; smile: number; size: number; cx: number; cy: number };
export type Step = "lurus" | "kiri" | "kanan" | "senyum" | "atas" | "bawah";

export const stepText: Record<Step, string> = {
  lurus: "Lihat lurus ke kamera dan diam sejenak",
  kiri: "Tolehkan kepala ke kiri",
  kanan: "Tolehkan kepala ke kanan",
  senyum: "Tersenyumlah",
  atas: "Angkat dagu, lihat ke atas",
  bawah: "Tundukkan kepala, lihat ke bawah",
};

const NOSE = 1, LEFT = 234, RIGHT = 454, TOP = 10, CHIN = 152;

/** Ringkas satu bingkai menjadi arah kepala (yaw, pitch), senyum, dan ukuran/posisi wajah. */
export function measure(faces: Landmark[][], blendshapes?: Blendshape[]): Sample {
  if (!faces.length) return { faces: 0, yaw: 0.5, pitch: 0.5, smile: 0, size: 0, cx: 0.5, cy: 0.5 };
  const lm = faces[0];
  const nose = lm[NOSE], a = lm[LEFT], b = lm[RIGHT], top = lm[TOP], chin = lm[CHIN];
  const minX = Math.min(a.x, b.x), width = Math.max(Math.abs(b.x - a.x), 1e-6), height = Math.max(Math.abs(chin.y - top.y), 1e-6);
  const score = (name: string) => blendshapes?.find(c => c.categoryName === name)?.score ?? 0;
  return {
    faces: faces.length,
    yaw: (nose.x - minX) / width,
    pitch: (nose.y - top.y) / height,
    smile: (score("mouthSmileLeft") + score("mouthSmileRight")) / 2,
    size: width,
    cx: (a.x + b.x) / 2,
    cy: (top.y + chin.y) / 2,
  };
}

/** Urutan acak setiap kali, agar tidak dapat diakali dengan rekaman video yang sama. */
export function randomSteps(rand: () => number = Math.random): Step[] {
  const rest: Step[] = ["kiri", "kanan", "senyum", "atas", "bawah"];
  for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[rest[i], rest[j]] = [rest[j], rest[i]]; }
  return ["lurus", ...rest];
}

export type LivenessState = { step: Step | null; index: number; total: number; done: boolean; failed: string; message: string; capture: boolean };

const HOLD = 6;           // bingkai berturut-turut yang harus memenuhi syarat
const YAW = 0.14;         // perubahan arah toleh dari posisi lurus
const PITCH = 0.07;       // perubahan arah angguk dari posisi lurus
const SMILE = 0.55;
const MIN_SIZE = 0.22;    // lebar wajah minimal (bagian dari lebar gambar)
const TIMEOUT = 75_000;

/**
 * Mesin langkah verifikasi. Arah kiri/kanan dan atas/bawah tidak diasumsikan dari kamera (depan/belakang, dicerminkan
 * atau tidak): toleh pertama menetapkan tanda arah, langkah berikutnya pada sumbu yang sama harus ke arah sebaliknya.
 */
export class Liveness {
  private index = 0; private hold = 0; private started: number;
  private base: { yaw: number; pitch: number } | null = null;
  private leftSign = 0; private upSign = 0;
  private failed = "";
  constructor(readonly steps: Step[], now: number) { this.started = now; }

  update(s: Sample, now: number): LivenessState {
    const state = (message: string, capture = false): LivenessState => ({ step: this.steps[this.index] ?? null, index: this.index, total: this.steps.length, done: this.index >= this.steps.length, failed: this.failed, message, capture });
    if (this.failed || this.index >= this.steps.length) return state("");
    if (now - this.started > TIMEOUT) { this.failed = "Waktu habis. Ulangi verifikasi dan ikuti petunjuk di layar."; return state(""); }
    if (s.faces === 0) { this.hold = 0; return state("Wajah tidak terlihat. Pastikan wajah berada di dalam bingkai dan cukup terang."); }
    if (s.faces > 1) { this.hold = 0; return state("Pastikan hanya satu wajah di kamera."); }
    if (s.size < MIN_SIZE) { this.hold = 0; return state("Dekatkan wajah ke kamera."); }

    const step = this.steps[this.index];
    let ok = false;
    if (step === "lurus") ok = Math.abs(s.cx - 0.5) < 0.2 && Math.abs(s.yaw - 0.5) < 0.12 && s.smile < 0.4;
    else if (this.base) {
      const dy = s.yaw - this.base.yaw, dp = s.pitch - this.base.pitch;
      if (step === "kiri" || step === "kanan") {
        const want = step === "kiri" ? 1 : -1;
        if (!this.leftSign) ok = Math.abs(dy) > YAW; // toleh pertama menetapkan arah
        else ok = dy * this.leftSign * want > YAW;
        if (ok && !this.leftSign && this.hold + 1 >= HOLD) this.leftSign = Math.sign(dy) * want;
      } else if (step === "atas" || step === "bawah") {
        const want = step === "atas" ? 1 : -1;
        if (!this.upSign) ok = Math.abs(dp) > PITCH;
        else ok = dp * this.upSign * want > PITCH;
        if (ok && !this.upSign && this.hold + 1 >= HOLD) this.upSign = Math.sign(dp) * want;
      } else if (step === "senyum") ok = s.smile > SMILE;
    }

    if (!ok) { this.hold = 0; return state(""); }
    this.hold++;
    if (this.hold < HOLD) return state("Tahan…");
    this.hold = 0;
    const capture = step === "lurus";
    if (capture) this.base = { yaw: s.yaw, pitch: s.pitch };
    this.index++;
    return state("Bagus!", capture);
  }
}
