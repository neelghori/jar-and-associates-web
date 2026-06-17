type ApiLoadingListener = (pending: number) => void;

let pendingCount = 0;
const listeners = new Set<ApiLoadingListener>();

function notify() {
  listeners.forEach((listener) => listener(pendingCount));
}

export function getApiPendingCount() {
  return pendingCount;
}

export function subscribeApiLoading(listener: ApiLoadingListener) {
  listeners.add(listener);
  listener(pendingCount);
  return () => {
    listeners.delete(listener);
  };
}

export function trackApiLoading<T>(promise: Promise<T>): Promise<T> {
  pendingCount += 1;
  notify();
  return promise.finally(() => {
    pendingCount = Math.max(0, pendingCount - 1);
    notify();
  });
}
