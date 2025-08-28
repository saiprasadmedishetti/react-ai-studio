import { useEffect, useMemo, useRef, useState } from "react";
import { loadHistory, saveHistory } from "../utils/storage";
import { downscaleIfNeeded } from "../utils/file-helper";
import { mockGenerateAPI } from "../utils/mock-api";
import { classNames } from "../utils/cn";
import Spinner from "./spinner";
import { wait } from "../utils/timer";
import Preview from "./preview";
import History from "./history";

export type HistoryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  style: string;
  createdAt: string;
};

export default function App() {
  const [, setRawFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null); // prepared to send
  const [wasDownscaled, setWasDownscaled] = useState<boolean>(false);

  const [prompt, setPrompt] = useState<string>("");
  const [style, setStyle] = useState<string>("Editorial");

  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const styles = [
    "Editorial",
    "Streetwear",
    "Vintage",
    "Minimal",
    "Futuristic",
  ];

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    setStatus("");
    setRawFile(null);
    setImageDataUrl(null);
    setWasDownscaled(false);
    if (!file) return;

    if (!/(png|jpe?g)$/i.test(file.name)) {
      setError("Please upload a PNG or JPG file.");
      return;
    }

    try {
      const { dataUrl, wasDownscaled } = await downscaleIfNeeded(file, {
        maxDim: 1920,
      });
      setRawFile(file);
      setImageDataUrl(dataUrl as string);
      setWasDownscaled(!!wasDownscaled);
    } catch {
      setError("Failed to load image.");
    }
  }

  const canGenerate = !!imageDataUrl && prompt.trim().length > 0 && !isLoading;

  async function generateWithRetry() {
    setError("");
    setStatus("Generating…");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const maxAttempts = 3;
    let attempt = 0;
    let lastError: Error | null = null;
    let backoff = 500; // ms, exponential

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const res = await mockGenerateAPI({
          imageDataUrl: imageDataUrl!,
          prompt: prompt.trim(),
          style,
          signal: controller.signal,
        });

        setStatus("Done");
        setIsLoading(false);
        abortRef.current = null;

        // Save to history (front)
        const newItem = {
          id: res.id,
          imageUrl: res.imageUrl,
          prompt: res.prompt,
          style: res.style,
          createdAt: res.createdAt,
        };
        setHistory((prev) =>
          [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 5)
        );
        return; // success
      } catch (error) {
        const err = new Error(String(error));
        if (err?.name === "AbortError") {
          setStatus("Aborted");
          setIsLoading(false);
          abortRef.current = null;
          return; // stop retries on abort
        }
        lastError = err;
        if (attempt < maxAttempts) {
          setStatus(
            `Error: ${err?.message || "Failed"}. Retrying in ${backoff}ms…`
          );
          await wait(backoff, {});
          backoff *= 2;
        }
      }
    }

    setIsLoading(false);
    abortRef.current = null;
    setStatus("Failed after retries");
    setError(lastError?.message || "Generation failed");
  }

  function abortGeneration() {
    abortRef.current?.abort();
  }

  function restoreFromHistory(item: HistoryItem) {
    // Restore preview/prompt/style; keep history as-is
    setImageDataUrl(item.imageUrl);
    setPrompt(item.prompt);
    setStyle(item.style);
    setStatus(
      `Restored item from ${new Date(item.createdAt).toLocaleString()}`
    );
    setError("");
  }

  const liveSummary = useMemo(() => {
    return {
      prompt: prompt.trim() || "(no prompt)",
      style,
      hasImage: !!imageDataUrl,
    };
  }, [prompt, style, imageDataUrl]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-indigo-200">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            AI Studio Mini
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Left: Upload & Controls */}
        <section className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow p-4 md:p-5">
            <h2 className="text-lg font-medium mb-4">Upload & Settings</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium mb-2"
                >
                  Image (PNG/JPG, ≤10MB)
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleFileChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 rounded-xl"
                />
                {wasDownscaled && (
                  <p
                    className="mt-2 text-xs text-gray-600"
                    role="status"
                    aria-live="polite"
                  >
                    File was larger than 10MB — downscaled to ≤1920px before
                    sending.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium mb-1"
                >
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want…"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <label
                  htmlFor="style"
                  className="block text-sm font-medium mb-1"
                >
                  Style
                </label>
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                >
                  {styles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={generateWithRetry}
                  disabled={!canGenerate}
                  className={classNames(
                    "inline-flex items-center justify-center px-4 py-2 rounded-xl text-white font-medium shadow",
                    canGenerate
                      ? "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      : "bg-indigo-300 cursor-not-allowed"
                  )}
                  aria-disabled={!canGenerate}
                >
                  {isLoading ? (
                    <>
                      <Spinner label="Generating" />
                      <span className="ml-2">Generating…</span>
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>

                <button
                  type="button"
                  onClick={abortGeneration}
                  disabled={!isLoading}
                  className={classNames(
                    "inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium border",
                    isLoading
                      ? "border-gray-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                  aria-disabled={!isLoading}
                >
                  Abort
                </button>
              </div>

              <div aria-live="polite" className="min-h-[1.5rem] text-sm">
                {status && <p className="text-gray-700">{status}</p>}
                {error && <p className="text-red-600">{error}</p>}
              </div>
            </div>
          </div>

          <History history={history} restoreFromHistory={restoreFromHistory} />
        </section>

        <Preview imageUrl={imageDataUrl!} liveSummary={liveSummary} />
      </main>
    </div>
  );
}
