"use client";

// "Share on WhatsApp" and "Copy" buttons. Used by both the Kahani and Kavita pages.
//   noun: "story" or "poem"
import { useState } from "react";

// Copy text. The modern way needs https (or localhost); the old way works on
// a phone opening the site through the computer's Wi-Fi address too.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.opacity = "0";
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand("copy");
    box.remove();
    return ok;
  }
}

export default function ShareButtons({ title, paragraphs, text, noun = "story" }) {
  const [copied, setCopied] = useState(""); // "", "yes" or "no"
  const Noun = noun[0].toUpperCase() + noun.slice(1);

  function shareOnWhatsApp() {
    // Title + the first few lines + the link to this page (/kahani or /kavita)
    let preview = paragraphs[0] || "";
    if (preview.length > 220) preview = preview.slice(0, 220).replace(/\s+\S*$/, "");
    const link = window.location.origin + window.location.pathname;
    const message = `${noun === "poem" ? "🎉" : "🌙"} ${title}\n\n${preview}...\n\nCreate a ${noun} like this for your child: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  async function copyAll() {
    const ok = await copyText(text);
    setCopied(ok ? "yes" : "no");
    setTimeout(() => setCopied(""), 3000);
  }

  const button =
    "flex-1 rounded-full py-3 text-xl font-semibold shadow-lg transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50";

  return (
    <div className="mt-6 space-y-2 border-t border-line pt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={shareOnWhatsApp} className={`${button} bg-[#25D366] text-[#073b1c]`}>
          💬 Share on WhatsApp
        </button>
        <button onClick={copyAll} className={`${button} border border-line bg-field/60 text-ink`}>
          📋 Copy
        </button>
      </div>
      <p aria-live="polite" className="h-6 text-center text-ink/70">
        {copied === "yes" && `${Noun} copied ✓`}
        {copied === "no" && "Couldn't copy. Please select the text and copy it."}
      </p>
    </div>
  );
}
