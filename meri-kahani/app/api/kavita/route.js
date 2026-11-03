// POEM server route ("Fun Poem"). Separate from the story route (app/api/story/route.js).
// Runs on the server (never in the browser), so the secret key stays safe.
// Steps: check the form -> check usage limit -> AI writes the poem, sent to the browser piece by piece
// -> fast word check on the finished poem.
// Privacy: nothing the parent types and no poem is saved anywhere.

import { streamAI } from "@/lib/ai";
import { streamToBrowser } from "@/lib/streamResponse";
import { POEM_RULES, POEM_TOPICS, buildPoemRequest } from "@/lib/poemPrompt";
import { checkInput, NAME_MAX, FIELD_MAX } from "@/lib/safety";
import { allowStory, getAddress } from "@/lib/rateLimit";

// On Vercel: let this route run for up to 60 seconds (a story usually takes about 5).
export const maxDuration = 60;

const AGES = ["2", "3", "4", "5", "6", "7", "8", "9", "10"];
const LANGUAGES = ["English", "Hindi", "Marathi"];

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
    topic: body.topic,
  };

  // 1. Only allow the choices from our form
  if (
    !AGES.includes(details.age) ||
    !LANGUAGES.includes(details.language) ||
    !POEM_TOPICS.includes(details.topic)
  ) {
    return reply("Please fill the form properly.", 400);
  }

  // 2. Check name, lengths and bad words (same rules as stories)
  const inputProblem = checkInput(details);
  if (inputProblem) return reply(inputProblem, 400);

  // 3. Usage limit (shared with stories: 5 per person per hour in total)
  if (!allowStory(getAddress(request))) {
    return reply("That's a lot of poems for now! Please try again in a little while 🎉", 429);
  }

  // 4. Write the poem and send it to the browser as it is written
  return streamToBrowser(streamAI(POEM_RULES, buildPoemRequest(details), { maxTokens: 1536 }), {
    busy: "The poem maker is busy right now. Please try again in a little while. 🎉",
    failed: "Sorry, the poem couldn't be created. Please try again in a little while.",
  });
}
