import { useEffect, useState } from "react";

let loadingPromise = null;

function ensureMathJaxConfig() {
  window.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"]],
      displayMath: [["\\[", "\\]"]],
    },
    svg: {
      fontCache: "global",
    },
    startup: {
      typeset: false,
    },
  };
}

function loadMathJax() {
  if (window.MathJax?.typesetPromise) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    ensureMathJaxConfig();

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load MathJax"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export function useMathJax(deps = []) {
  const [ready, setReady] = useState(!!window.MathJax?.typesetPromise);

  useEffect(() => {
    let cancelled = false;

    loadMathJax()
      .then(() => {
        if (cancelled) return;
        setReady(true);
        window.MathJax?.typesetPromise?.().catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return ready;
}