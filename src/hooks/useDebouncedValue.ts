import { useEffect, useState } from "react";

/**
 * 値の変更を delay ms 遅延させて返す。
 * 連続変更中は値が確定せず、最後の変更から delay ms 経過後に反映される。
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
