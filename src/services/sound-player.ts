// sound-player.ts
type SoundName = 'victory' | 'failure' | 'click';

const SOUND_FILES: Record<SoundName, string> = {
  victory: 'victory.mp3',
  failure: 'failure.mp3',
  click: 'click.mp3'
};

// --- singleton AudioContext --------------------------------------------------
let ctx: AudioContext | null = null;
const getCtx = async () => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume();
  return ctx;
};

// --- buffer cache (lazy, deduplicated) ---------------------------------------
const bufferCache = new Map<SoundName, Promise<AudioBuffer>>();

function fileUrl(file: string): string {
  // Works in Next/Vite and plain web: /audio/<file>
  // If you deploy under a subpath (Vite), BASE_URL keeps it correct.
  const base = (import.meta as any)?.env?.BASE_URL ?? '/';
  return `${base.replace(/\/$/, '')}/audio/${file}`;
}

async function loadBuffer(name: SoundName): Promise<AudioBuffer> {
  if (!bufferCache.has(name)) {
    bufferCache.set(name, (async () => {
      const [ac, resp] = await Promise.all([getCtx(), fetch(fileUrl(SOUND_FILES[name]))]);
      const data = await resp.arrayBuffer();
      return ac.decodeAudioData(data);
    })());
  }
  return bufferCache.get(name)!;
}

// --- public API --------------------------------------------------------------
export async function playSound(

  name: SoundName,
  opts: { volume?: number; rate?: number; loop?: boolean } = {}
  
): Promise<void> {
  const ac = await getCtx();
  const buf = await loadBuffer(name);

  const src = ac.createBufferSource();
  src.buffer = buf;
  if (opts.rate) src.playbackRate.value = opts.rate;

  const gain = ac.createGain();
  gain.gain.value = opts.volume ?? 1;

  src.connect(gain).connect(ac.destination);
  src.loop = !!opts.loop;
  src.start();
}

export async function preloadSounds(names?: SoundName[]): Promise<void> {
  const all = names ?? (Object.keys(SOUND_FILES) as SoundName[]);
  await Promise.all(all.map(loadBuffer));
}

/** Call this once on a user gesture (click/tap) to satisfy iOS autoplay rules. */
export async function unlockAudio(): Promise<void> {
  const ac = await getCtx();
  if (ac.state === 'suspended') await ac.resume();
}

