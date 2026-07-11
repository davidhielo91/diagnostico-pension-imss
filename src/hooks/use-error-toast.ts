import { useState, useRef } from "react";

export function useErrorToast() {
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setErrorMsg(msg);
    timerRef.current = setTimeout(() => setErrorMsg(""), 3000);
  }

  return { errorMsg, showError };
}
