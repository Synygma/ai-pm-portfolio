// ============================================================
//  SENDS THE STORY / POEM TO THE BROWSER PIECE BY PIECE (streaming)
//  Shared by the story and poem routes.
//
//  What the browser receives:
//    the text, piece by piece, then at the very end one special marker:
//      END + "OK"      -> finished, and the word check passed
//      END + "UNSAFE"  -> finished, but a blocked word was found: hide the text
//      END + "ERROR"   -> something broke halfway: hide the text
//  If the AI fails before any text, we send a normal error message instead (JSON).
// ============================================================

import { isTextClean } from "@/lib/safety";

export const END = "\u001E"; // an invisible character that never appears in stories

export async function streamToBrowser(textPieces, messages) {
  const iterator = textPieces[Symbol.asyncIterator]();

  // Wait for the first piece, so errors (busy / limit) can still get a proper message.
  let first;
  try {
    first = await iterator.next();
    if (first.done) throw new Error("The AI returned an empty reply.");
  } catch (error) {
    if (error.code === "RATE_LIMIT") {
      return Response.json({ error: messages.busy }, { status: 429 });
    }
    console.error("Generation failed:", error.message);
    return Response.json({ error: messages.failed }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (text) => controller.enqueue(encoder.encode(text));
      let fullText = "";
      try {
        let step = first;
        while (!step.done) {
          fullText += step.value;
          send(step.value);
          step = await iterator.next();
        }
        const clean = isTextClean(fullText);
        if (!clean) console.warn("Finished text failed the word check; the browser will hide it.");
        send(END + (clean ? "OK" : "UNSAFE"));
      } catch (error) {
        console.error("Generation stopped halfway:", error.message);
        send(END + "ERROR");
      }
      controller.close();
    },
    cancel() {
      iterator.return?.(); // the parent left the page: stop asking the AI
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // tell servers in between not to hold the text back
    },
  });
}
