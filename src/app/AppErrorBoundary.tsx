import type { ReactNode } from "react";
import { Component } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Trumpet Reflex failed to render", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-6 text-[#1D1D1F] dark:bg-[#111113] dark:text-[#F4F4F5]">
        <section className="w-full max-w-sm rounded-lg border border-[#D2D2D7] bg-white p-6 shadow-sm dark:border-[#3F3F46] dark:bg-[#1C1C20]">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#A1A1AA]">Trumpet Reflex</p>
          <h1 className="mt-3 text-2xl font-black">App needs a reload</h1>
          <p className="mt-3 text-sm leading-6 text-[#515154] dark:text-[#D4D4D8]">
            The app hit a startup error, often after a PWA update. Reloading usually picks up the newest version.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-12 w-full rounded-lg bg-[#007AFF] px-4 text-base font-bold text-white"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
