// This runs on the server (never in the browser), so the secret key stays safe.
// Steps: check the form -> check usage limit -> AI writes the story, sent to the browser piece by piece
// -> fast word check on the finished story.
// Privacy: nothing the parent types and no story is saved anywhere.

import { streamAI } from "@/lib/ai";
import { streamToBrowser } from "@/lib/streamResponse";
import { STORY_RULES, buildStoryRequest } from "@/lib/storyPrompt";
import { checkInput, NAME_MAX, FIELD_MAX } from "@/lib/safety";
import { allowStory, getAddress } from "@/lib/rateLimit";

// On Vercel: let this route run for up to 60 seconds (a story usually takes about 5).
export const maxDuration = 60;

const AGES = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
const LANGUAGES = ["English", "Hindi", "Marathi"];
const VALUES = [
  "Sharing",
  "Honesty",
  "Courage",
  "Kindness",
  "Being brave at night",
  "Listening to elders",
];

// Tidy spaces. (A little extra room, so checkInput can tell the parent if text is too long.)
function clean(text, max) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max + 1);
}

function reply(error, status) {
  return Response.json({ error }, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return reply("Something went wrong. Please try again.", 400);
  }

  const details = {
    childName: clean(body.childName, NAME_MAX),
    age: String(body.age),
    language: body.language,
    family: clean(body.family, FIELD_MAX),
    favourites: clean(body.favourites, FIELD_MAX),
    value: body.value,
  };

  // 1. Only allow the choices from our form
  if (
    !AGES.includes(details.age) ||
    !LANGUAGES.includes(details.language) ||
    !VALUES.includes(details.value)
  ) {
    return reply("Please fill the form properly.", 400);
  }

  // 2. Check name, lengths and bad words
  const inputProblem = checkInput(details);
  if (inputProblem) return reply(inputProblem, 400);

  // 3. Max 5 stories per person per hour
  if (!allowStory(getAddress(request))) {
    return reply("That's a lot of stories for now! Please try again in a little while 🌙", 429);
  }

  // 4. Write the story and send it to the browser as it is written
  return streamToBrowser(streamAI(STORY_RULES, buildStoryRequest(details), { maxTokens: 4096 }), {
    busy: "The story maker is busy right now. Please try again in a little while. 🌙",
    failed: "Sorry, the story couldn't be created. Please try again in a little while.",
  });
}
