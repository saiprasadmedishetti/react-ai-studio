import { wait } from "./timer";

type MockGenerateAPIParams = {
  imageDataUrl: string;
  prompt: string;
  style: string;
  signal?: AbortSignal;
};

interface ModelOverloadedError extends Error {
  code?: string;
}

export async function mockGenerateAPI({
  imageDataUrl,
  prompt,
  style,
  signal,
}: MockGenerateAPIParams) {
  // Simulates 1–2s latency, 20% error
  const delay = 1000 + Math.floor(Math.random() * 1000);
  await wait(delay, { signal });

  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  if (Math.random() < 0.2) {
    const err = new Error("Model overloaded") as ModelOverloadedError;
    err.code = "MODEL_OVERLOADED";
    throw err;
  }

  const res = {
    id: crypto.randomUUID(),
    imageUrl: imageDataUrl, // echo back image (as if generated)
    prompt,
    style,
    createdAt: new Date().toISOString(),
  };
  return res;
}
