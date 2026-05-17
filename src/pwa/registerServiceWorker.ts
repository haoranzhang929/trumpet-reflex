import { registerSW } from "virtual:pwa-register";

type PwaUpdateListener = () => void;

const listeners = new Set<PwaUpdateListener>();

export const updateServiceWorker = registerSW({
  onNeedRefresh() {
    listeners.forEach((listener) => listener());
  },
  immediate: true
});

export function subscribeToPwaUpdates(listener: PwaUpdateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
