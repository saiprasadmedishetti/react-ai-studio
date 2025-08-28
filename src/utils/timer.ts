export function wait(ms: number, { signal } = {} as { signal?: AbortSignal }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Aborted", "AbortError"));
    const to = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(to);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
