import { useEffect, useState } from "react";
import { loadVTracer } from "@/lib/vtracer-loader";

interface State {
  status: "loading" | "ready" | "error";
  error: string | null;
}

export function useVTracer(): State {
  const [state, setState] = useState<State>({ status: "loading", error: null });

  useEffect(() => {
    let cancelled = false;
    loadVTracer()
      .then(() => {
        if (!cancelled) setState({ status: "ready", error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ status: "error", error: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
