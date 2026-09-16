export interface Semaphore {
  acquire(signal?: AbortSignal): Promise<void>;
  release(): void;
}

export function createSemaphore(maxConcurrency: number): Semaphore {
  if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
    throw new RangeError("maxConcurrency must be a positive integer");
  }

  let inFlight = 0;
  const waiters: Array<() => void> = [];

  return {
    async acquire(signal?: AbortSignal): Promise<void> {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      if (inFlight < maxConcurrency) {
        inFlight += 1;
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const grant = () => {
          signal?.removeEventListener("abort", onAbort);
          inFlight += 1;
          resolve();
        };
        const onAbort = () => {
          const index = waiters.indexOf(grant);
          if (index !== -1) waiters.splice(index, 1);
          reject(new DOMException("Aborted", "AbortError"));
        };
        signal?.addEventListener("abort", onAbort, { once: true });
        waiters.push(grant);
      });
    },
    release(): void {
      if (inFlight === 0) return;
      inFlight -= 1;
      const next = waiters.shift();
      if (next) next();
    },
  };
}
