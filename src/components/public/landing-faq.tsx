"use client";

import { useState } from "react";
import { LANDING_FAQS } from "@/lib/landing-content";

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  function toggle(i: number) {
    setOpen(open === i ? null : i);
  }

  return (
    <div className="faq-list" role="list">
      {LANDING_FAQS.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? " open" : ""}`} role="listitem">
          <button
            className="faq-btn"
            type="button"
            aria-expanded={open === i}
            onClick={() => toggle(i)}
          >
            <span>{faq.q}</span>
            <span className="faq-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          <div className={`faq-panel${open === i ? " open" : ""}`}>
            {faq.a.split("\n\n").map((par, j) => <p key={j}>{par}</p>)}
          </div>
        </div>
      ))}
    </div>
  );
}
