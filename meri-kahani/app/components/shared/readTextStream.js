// Reads the story / poem from the server piece by piece (streaming).
// Shared by the story and poem forms.
//   onText(textSoFar) is called every time new words arrive.
//   Returns { text, status } where status is "OK", "UNSAFE" or "ERROR".
// (The END marker must match lib/streamResponse.js.)

const END = "\u001E";

export async function readTextStream(response, onText) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += decoder.decode(value, { stream: true });
    const end = received.indexOf(END);
    onText(end >= 0 ? received.slice(0, end) : received);
  }
  received += decoder.decode();

  const end = received.indexOf(END);
  if (end < 0) return { text: received, status: "ERROR" }; // connection dropped before the end
  return { text: received.slice(0, end), status: received.slice(end + 1).trim() };
}
