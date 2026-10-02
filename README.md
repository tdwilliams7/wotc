#### Wotc Event Scheduler

## Run it
```bash
docker compose up --build
```
App: http://localhost:5173 · API: http://localhost:4000/graphql

Requires Docker. For local dev without Docker, use Node 22 (`.nvmrc`):
`docker compose up -d db`, then `npm run seed && npm run dev` in `backend/` and `npm run dev` in `frontend/`.
Tests: `docker compose up -d db && cd backend && npm test`.

If network issues prevent the application from loading on phone:
```
cloudflared tunnel --url http://localhost:5173
```
will host the localhost on ```https://<something>.trycloudflare.com``` url will be in terminal message.

### Design

#### Frontend Plan

React + TypeScript (Vite), Apollo Client for GraphQL, FullCalendar for the month grid, React Router for pages.
Every screen has a real URL, so the QR code and invite link work when opened on another device.
| Route | Purpose |
| `/events/new` | Create event |
| `/` | Calendar |
| `/events/:id` | Event details |
| `/events/:id/register` | Player registration |

**Create event (`/events/new`)**
- Fields: name, game, format, date, start time, duration, capacity.
- Everything game-specific comes from the selected game template: available formats, default duration, default capacity, max capacity, and minimum players. Changing the game resets those fields to its defaults, and the form has no game-specific logic.
- Capacity is editable but capped by the template's max (never above 30, per the brief). Client validation is UX only. The server re-validates everything.

**Calendar (`/`)**
- Month grid of scheduled events.
- Clicking a day lists that day's events with spots left. Each has a link to its detail page.

**Event page (`/events/:id`)**
- Event details, spots left, a downloadable `.ics` invite, and a QR code that encodes the registration link.
- The registration URL is built from `VITE_PUBLIC_URL`, not `window.location`, so the QR works when scanned from a phone.
**Registration page (`/events/:id/register`)**
- Shows event name, date, time, and spots left, plus a name field.
- Clear messages for full and duplicate registrations, sourced from the server's typed error codes.

#### Backend Plan

Node + TypeScript, Express hosting a GraphQL endpoint (graphql-yoga) at `/graphql`, and Postgres 16.
It's a modular monolith with service-shaped boundaries:

| Module | Owns |
| --- | --- |
| `templates` | Game template registry and lookup |
| `events` | Event creation, listing, and validation against the template |
| `registrations` | The only code that writes registration rows (capacity logic lives here) |
| `calendar` | `.ics` generation |

The invite is a plain HTTP route (`GET /events/:id/invite.ics`) rather than GraphQL because it's a file download that has to work as a link from anywhere.

## Out of scope / next steps

**Cut because the exercise excluded it**
- **Admin dashboard for game templates.** Templates are seeded data. See "Adding a 4th game" above for what a self-serve flow would need (a `createTemplate` mutation, a form, authorization, and archive semantics).
- **Email confirmation and a reminder 3 days before the event.**
- **Cancelling a registration** (for example via a link in the confirmation email).
- **Editing or cancelling events, and a waitlist.**
- **Auth.** There is one implicit organizer, and `/events/new` is open to anyone with the URL.

**Known gaps**
- **Stronger duplicate prevention.** Duplicates are detected by normalized name only, so two different people named "Sam Lee" collide. Next step is registering with an email or phone number, or real auth.
- **Abuse protection.** Anonymous, name-only registration means anyone with the link can fill an event with fake names. Next steps are rate limiting and verified contact details.
- **Past events.** Registration and event creation aren't blocked for past dates, and the seed uses fixed dates. Next step: reject registration after the event starts (a new `EVENT_STARTED` code, checked inside the locked transaction) and reject past start times in `createEvent`.
- **Minimum players.** `minPlayers` only sets a capacity floor. Under-filled events aren't flagged or cancelled.
- **Time zone.** Events use a single store time zone configured server-side. The `.ics` uses UTC times with no `VTIMEZONE` block.
- **Scale.** The `events` query has no pagination or date-range filter.
- **Operations.** The container runs the idempotent seed on every start (production would separate migrations from seeding). Unexpected errors surface as generic GraphQL errors with no structured logging.
- **Testing.** The tests cover the backend, including the concurrency cases. There are no frontend tests. The QR flow was verified end to end by scanning the code from a phone over cellular through a Cloudflare tunnel (```cloudflared tunnel --url http://localhost:5173```), registering a name, and seeing the count update on the desktop.

### How capacity is determined and enforced

**Where it comes from.** Each game template supplies a default capacity and a maximum. An organizer can override the default when creating an event, within the template's max and never above 30 (the exercises' limit). Capacity is stored as a column on `events`. `registeredCount` is not stored: it's computed from the `registrations` table, so it can't drift.

**Enforcement in three layers**
1. **Database constraints** guarantee the global bounds: `CHECK (capacity BETWEEN 1 AND 30)` on events, and `min_players <= default_capacity <= max_capacity <= 30` on templates.
2. **`createEvent` validation** enforces the per-template rules (that game's max and minimum players). The client's checks are UX only.
3. **`register` runs in a transaction that locks the event row** (`SELECT ... FOR UPDATE`), then checks for a duplicate, counts registrations, and inserts or rejects.

**Concurrent registrations for the last seat.** Every registration for a given event queues on that row lock. Once a request holds it, its count includes every registration committed before it, so exactly one racer gets the last seat and the rest receive `EVENT_FULL`. Different events don't block each other. Because the lock lives in Postgres, the guarantee holds with multiple API instances. `UNIQUE (event_id, normalized_name)` is a backstop, so a bug in the check logic still can't create duplicate rows. 

Full and duplicate are expected outcomes, not exceptions. `register` returns a union (`RegisterSuccess | RegisterError`) with a typed `code`: `NOT_FOUND`, `INVALID_NAME`, `DUPLICATE`, `EVENT_FULL`. Duplicates are checked before full, so an existing player sees the more useful message.

**Why a row lock.** Contention is per event and low, the lock is held for milliseconds, and the code stays simple. Optimistic retries or `SERIALIZABLE` transactions would also work but need retry handling that the lock avoids.

**Tests** run against the real Postgres, since mocking the DB would defeat the point. They cover:
- 50 concurrent registrations against a 30-seat event: exactly 30 succeed and 20 get `EVENT_FULL`.
- 10 racers for the last of 4 seats: exactly 1 wins.
- 8 concurrent registrations with the same name in different casing and spacing: exactly 1 succeeds.
- Blank names and unknown event IDs.

### Template system

A game template is a plain data record: `id`, `name`, `formats[]`, `defaultDurationMinutes`, `defaultCapacity`, `maxCapacity`, `minPlayers`. Templates live in the `game_templates` table and are seeded idempotently from a registry in `modules/templates/data.ts`. Events reference a template by foreign key.

**What a template drives**
- `formats` → the formats an event may use (`createEvent` rejects any other)
- `defaultDurationMinutes` → the event's duration when none is given
- `defaultCapacity` → the event's capacity when none is given
- `maxCapacity` → the capacity ceiling (never above the global 30)
- `minPlayers` → the capacity floor. It does not yet flag or cancel under-filled events.

No code checks game names. The server reads the template, and the frontend fetches templates over GraphQL and builds the create form from them. Capacity and duration are copied onto the event at creation, so changing a template later doesn't alter existing events.

**Adding a 4th game.** 
A self-serve flow is the admin dashboard I scoped out, and it would need:
- A `createTemplate` mutation. The server would generate the id (a slug of the name), enforce the same invariant the database already checks (`min_players <= default_capacity <= max_capacity <= 30`), and reject duplicate names.
- A template form: name, formats, default duration, default and max capacity, minimum players. The event form needs no changes, because it already builds itself from the templates query.
- Authorization. There is no auth in this app, and a screen that edits shared configuration shouldn't be open to anyone with the URL.
- Edit and retire semantics. Because events reference templates, retiring a game would be an `archived` flag that hides it from the create form, not a delete.

**A non-card game** works the same way if it fits these fields (a board game night or a tournament, for example). If it doesn't, such as teams, brackets, or per-round timing, the options are new template columns or a JSONB `config` column for game-specific extras. The JSONB route is more flexible but gives up database-level constraints on those fields. Either way, registration logic is untouched.


## AI usage note

I used Claude throughout, as a pair-programmer and reviewer: scaffolding the React components, the Postgres schema, the GraphQL layer, and the transactional `register` function, and debugging setup problems. I used claude code to generate code after first creating the overall design plan myself, including the frameworks and architecture I wanted to use. I uploaded that plan and had claude code implement the frontend incrementally, starting with event creation and the main event views before moving on to registration. I ran into some routing issues where the generated implementation wasn’t working the way I intended, so I corrected the routing myself, sent the updated changes back to claude code, and had it continue from there.
 I wrote down the design answers in this README myself against the code as built. The things I verified myself: the concurrency tests against real Postgres, the full flow through Docker, and the QR flow from a phone through a Cloudflare tunnel.

**Output I had to fix or reject:**
- **Routing.** The main example of AI output I rejected was the initial routing implementation I identified where it didn’t match the application flow I had designed, fixed it myself, and then continued using claude code from the corrected state. (Hard-coded view array (home, calendar, event, types))
- **FullCalendar versions.** The install command Claude gave me pulled `@fullcalendar/react` v7 while the plugins were on v6. That caused a type error and then "Class constructor DayTableView cannot be invoked without 'new'". I diagnosed it with `npm ls` (two copies of `@fullcalendar/core`) and pinned all four packages to 6.1.21.
- **Scope creep.** Claude generated a game-template admin form. I removed it because the brief lists admin dashboards as out of scope. Template extensibility is covered by the registry and seed instead.
- **Code that referenced something that didn't exist.** A later config change called a `requireUrl` helper that was never in my file, which broke the Docker build. I added the missing helper.


