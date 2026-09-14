import { useEffect, useState } from "react";

export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useIdle(idleAfterMs = 4000): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), idleAfterMs);
    };
    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("mousedown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("mousedown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [idleAfterMs]);
  return idle;
}
