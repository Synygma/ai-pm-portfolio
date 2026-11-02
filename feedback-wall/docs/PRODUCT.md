# Product — Feedback Wall

## Summary

Feedback Wall is a public, real-time "sticky-note board". Anyone can post a short feedback note without signing up, and every visitor sees all notes on a shared wall. New notes appear instantly for everyone without a page refresh.

## Target users

- Visitors who want to leave quick, low-effort feedback or comments.
- Organizers (event hosts, teams, teachers) who share the wall link and watch feedback come in live.

## Current features

### 1. Post a note

- A form with a **message** (required, 1–280 characters) and an optional **name** (up to 40 characters).
- If no name is given, the note shows "Anonymous".
- The user can optionally **rate their experience** on a 5-step emoji scale (Bored, Not good, Okay, Good, Very nice).
- The user can optionally pick a note **color** from a fixed palette; otherwise one is assigned at random.
- A live character counter shows remaining characters.
- Clear inline errors for invalid input and for rate-limit rejection ("You're posting too fast, try again in a minute").
- The form clears after a successful post.

### 2. View the wall

- All notes are shown as colored sticky-note cards in a responsive grid, newest first.
- Each card shows the message, author name, relative time, and the rating (emoji + label) if one was given (e.g. "2 min ago").
- Cards have a slight random tilt for a sticky-note feel (purely visual).
- The wall loads the latest 50 notes first; a "Load older notes" button fetches more.

### 3. Live updates

- New notes from anyone appear at the top of the wall instantly for all connected visitors.
- If the connection drops, the browser reconnects automatically and the wall stays usable.
- A small status indicator shows whether the wall is live or reconnecting.

## Scope and non-goals (for now)

Not included in the current version:

- User accounts, login, or authentication
- Editing or deleting notes (by users or admins)
- Replies, reactions, likes, or threads
- Multiple walls/boards
- Images, links preview, or rich text (notes are plain text)
- Moderation tools or profanity filtering

These may be added later. When they are, move them into "Current features" and record the change in `CHANGELOG.md`.

## Glossary

- **Note / Feedback:** a single posted message. Called `feedback` in code and the database.
- **Wall:** the shared board showing all notes.
- **Stream:** the Server-Sent Events connection that pushes new notes to browsers.
