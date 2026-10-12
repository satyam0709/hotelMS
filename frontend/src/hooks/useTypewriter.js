"use client";

import { useEffect, useState } from "react";

/**
 * Reveals `text` one character at a time after `startDelay`.
 * @returns {{ displayed: string, done: boolean }}
 */
export default function useTypewriter(text, { speed = 38, startDelay = 600 } = {}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) {
      setDone(true);
      return undefined;
    }

    let index = 0;
    let intervalId = 0;
    const delayId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(intervalId);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(delayId);
      window.clearInterval(intervalId);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
