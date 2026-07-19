# Signup profile step, self-service settings, functional contact form, header/sidebar simplification

## Context

Six related UX/product gaps, all touching the client identity/account surface:

1. `/join` only collects name/email/password — no phone (needed for coaching contact) and no
   optional profile info (dob/height/weight/nationality/photo), which today only a coach can add
   via the client detail page. The user wants signup to collect phone (required) up front, then
   offer the optional profile fields as a second step, explicitly framed as skippable since the
   client can fill them in later from their own portal.
2. There's no self-service "edit my info" surface for a client — only the coach-side
   `ClientProfileFormDialog` exists. This blocks the promise in (1) that a client can "edit later."
3. The Founder's Note membership card (`PromoBanner.tsx`) has a dead "Apply Now" button under an
   "Elite Coaching" heading — cosmetic leftover from the original static marketing site, never
   wired to anything. Confirmed with the user: replace the heading with "Register Now" and point
   the button at `/join`.
4. The contact form is static markup — the submit button has no `onClick` and does nothing.
5. Header's account icon opens a dropdown (portal link + log out) — the user wants one click to go
   straight to the portal, no menu.
6. Both dashboard shells (`DashboardLayout.tsx`) show a bordered "{name} / {role} account" card
   above the Site/Log out buttons in the desktop sidebar — the user wants that card gone.

None of this touches coach-side flows (`ClientProfileFormDialog`, `AssignSplitDialog`, etc.) —
those keep working exactly as-is; this is additive (new self-service RPCs) plus targeted UI edits.

## 1. Signup: phone required + optional step 2

`src/routes/join.tsx` becomes a 2-step wizard, same component (no remount), state persists across
steps:

- **Step 1** (unchanged fields + new required Phone): package cards (as today) + Name, Email,
  Password, Confirm Password, **Phone** — same underlined-input style already established here and
  in `login.tsx`. A "Next" button (`type="button"`) validates: package chosen, password match, and
  native required-field validity via `formRef.current?.reportValidity()` (only step-1 fields are
  mounted at this point, so it only checks those) — then sets `step = 2`.
- **Step 2** (new, all optional — explicit copy: "Optional — you can always update this later from
  your portal settings"): Date of Birth (Popover+Calendar, same as `ClientProfileFormDialog.tsx`,
  styled as an underlined trigger button to match the rest of `/join` rather than the dashboard's
  bordered-box picker), Height (cm), Weight (kg), Nationality, Profile Picture (same circular
  blob-preview `ImagePlus` picker `ClientProfileFormDialog.tsx` uses). "Back" (→ step 1) and
  "Create Account" (`type="submit"`) buttons.
- Small "Step 1 of 2" / "Step 2 of 2" eyebrow-style label for orientation.
- Final submit calls `joinFn` with the merged payload (name/email/password/packageId/phone +
  dob/weight/height/nationality/profilePicture, nulls for anything left blank on step 2).

**Profile-picture upload pre-account**: the existing `uploadClientProfilePictureFn` is
`coachMiddleware`-gated, unusable pre-signup. Add a public sibling
`uploadJoinProfilePictureFn` in `src/clients/functions.ts` (no middleware — same
`saveClientProfilePicture` helper, just a disk write + URL back, no DB write, so no auth needed;
mirrors how `getPublicPackagesFn` is the one public exception in an otherwise
`coachMiddleware`-only file).

**`src/auth/functions.ts`** (`joinFn`): extend the validator with `phone: z.string().min(1, "Phone
number is required")` plus the existing nullable profile fields — reuse
`clientProfileInputSchema` from `src/clients/functions.ts` (export it, currently unexported) via
`.omit({ phone: true })` merged with a local schema that has `phone` as required instead of
nullable. Handler: after `createClientUser`, call `upsertClientProfile` (import from
`@/clients/clients.server`, same cross-domain-import pattern already used for `assignPackage`)
with the profile fields, then `assignPackage` and session-set exactly as today.

## 2. Client self-service settings page

New RPCs in `src/clients/functions.ts`, all `authMiddleware` (not `coachMiddleware` — self-service,
no role check beyond "logged in"; the underlying `upsertClientProfile` already throws "Client not
found" if called against a non-client user, so it's naturally self-limiting):

- `getOwnClientProfileFn` — calls new `getOwnProfile(userId)` in `src/clients/clients.server.ts`
  (same shape as the relevant slice of `getClientDetail`, no assignment history needed): returns
  `{ id, name, email, profile }` for `context.user.id`.
- `updateOwnClientProfileFn` — validates `{ name: z.string().min(1), profile:
  clientProfileInputSchema }`. Calls `upsertClientProfile(context.user.id, data.profile)`, then a
  new `updateUserName(userId, name)` in `src/auth/credentials.server.ts` (simple `$set` on
  `users.name`), then refreshes the session (`getAuthSession()` → `session.update({ userId, email,
  name: data.name, role })` using `context.user`'s existing id/email/role) so the new name shows up
  immediately without a re-login.
- `uploadOwnProfilePictureFn` — same file-upload handler as the coach one, just `authMiddleware`
  instead of `coachMiddleware`.

New route `src/routes/portal/settings.tsx`: `PageHeader` + a form that's essentially
`ClientProfileFormDialog.tsx`'s field set (Profile Picture / DOB / Weight / Height / Phone /
Nationality — same shadcn `Input`/`Label`/`Popover`+`Calendar` dashboard styling, not the marketing
underlined style) plus a new **Name** field, inlined on the page (not a dialog — no existing
"inline settings form" to extract to, and it's used in exactly one place, so no new shared
component). Save button follows the dashboard's hand-rolled-`<button>` convention. On success:
invalidate the profile query and call `router.invalidate()` (refreshes the root-level session user
so the sidebar/header pick up a changed name immediately, same pattern `logoutFn`/`loginFn` already
rely on).

Add a "Settings" entry to `src/routes/portal.tsx`'s `NAV_ITEMS` (`Settings` icon from
`lucide-react`).

## 3. Founder's Note CTA

`src/components/sections/PromoBanner.tsx`: heading `"Elite Coaching"` → `"Register Now"`; button
becomes a `Link to="/join"` (import from `@tanstack/react-router`) labeled "Join Us", same visual
treatment (border-b underline + `ArrowUpRight` icon) as today's button — just now a real link
instead of an inert `<button>`.

## 4. Functional contact form

New `src/contact/` domain (mirrors the shape of `src/subscriptions/` minus the coach-admin half —
this is guest-only, no coach view requested):

- `types.ts` — `ContactMessageInput { name, email, phone, message }`.
- `contact.server.ts` — `submitContactMessage(input)`: inserts into a new `contactMessages`
  collection: `{ _id, name, email, phone: string | null, message, createdAt }`.
- `functions.ts` — `submitContactMessageFn`, public `createServerFn` (no middleware — this is the
  app's first public *write*, but that's inherent to "guest submits a contact form"; same
  no-CSRF-guard posture already flagged as a known gap for the rest of the app), validates
  `{ name: min(1), email: z.string().email(), phone: z.string().nullable(), message: min(1) }`.

`src/routes/contact.tsx`: convert the static form to controlled inputs + `useMutation`, disable the
submit button while pending, replace the form with a "Thanks — we'll be in touch" confirmation on
success (matches the underlined-input style already there, no visual redesign), show a
`text-destructive` error line on failure. Phone stays optional (as it is implicitly today — no
`required` attribute); Name/Email/Message become `required`.

No coach-facing inbox for these messages is being built — same "log it, no admin UI yet" scope as
the user asked for. Will flag as a follow-up in CLAUDE.md's open questions.

## 5. Header: no dropdown, direct portal navigation

`src/components/Header.tsx`: replace the `DropdownMenu`/`DropdownMenuTrigger`/... block (the
`user ? (...) : (...)` branch's logged-in case) with a plain `<Link to={portalHome}>` wrapping the
`User` icon — same `grid h-10 w-10 place-items-center rounded-sm hover:bg-muted` button styling,
`aria-label` becomes "Coach CMS"/"Client Portal" depending on role. Drop the now-unused
`DropdownMenu*` and `LayoutDashboard` imports (`LogOut`/`handleLogout` stay — still used by the
mobile drawer's log-out button, which is untouched). Desktop no longer offers a log-out affordance
from the marketing header; the client/coach portal sidebar still has one, so this isn't a dead end.

## 6. Remove the sidebar "account" card

`src/components/dashboard/DashboardLayout.tsx`: in the desktop sidebar's bottom
`border-t border-border p-4` block, delete the inner `rounded-sm border border-border p-3` box
(the `{user.name}` / `{user.role} account` card) and keep the Site/Log out buttons row directly
inside the `p-4` wrapper (drop the now-redundant `mt-2` on that row since it's the first child).
Mobile drawer's plain-text name line is untouched — it's not the bordered "card" the ask refers to.

## Files

**New:**
- `src/contact/types.ts`, `src/contact/contact.server.ts`, `src/contact/functions.ts`
- `src/routes/portal/settings.tsx`

**Modified:**
- `src/routes/join.tsx` — 2-step wizard
- `src/auth/functions.ts` — `joinFn` extended
- `src/auth/credentials.server.ts` — `updateUserName`
- `src/clients/functions.ts` — export `clientProfileInputSchema`; add `getOwnClientProfileFn`,
  `updateOwnClientProfileFn`, `uploadOwnProfilePictureFn`, `uploadJoinProfilePictureFn`
- `src/clients/clients.server.ts` — `getOwnProfile`
- `src/routes/contact.tsx` — functional form
- `src/routes/portal.tsx` — Settings nav item
- `src/components/Header.tsx` — direct-nav account icon
- `src/components/dashboard/DashboardLayout.tsx` — drop sidebar account card
- `src/components/sections/PromoBanner.tsx` — Register Now / Join Us CTA
- `CLAUDE.md` — document all of the above (join's 2-step flow + required phone, new
  `contactMessages` collection, client self-service settings, header/sidebar simplifications)

## Verification

1. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds.
2. As guest: `/join` — step 1 requires phone before advancing; step 2 fields are optional (can hit
   "Create Account" with all of them blank); a filled-in step 2 (incl. a photo) round-trips
   correctly onto the created account. Land on `/portal` after either path.
3. As that new client: `/portal/settings` shows the data entered (or blanks, for the skip path),
   edit and save, confirm it persists on reload and the sidebar name updates without re-login.
4. `/contact` — submit succeeds and shows the confirmation state; check `contactMessages` in Mongo
   for the new document; submitting with an empty required field is blocked client-side.
5. Home page: Founder's Note card button navigates to `/join`.
6. Header: as a logged-in client and as the coach, clicking the account icon goes straight to
   `/portal` / `/coach` with no dropdown appearing.
7. `/portal` and `/coach` desktop sidebar: confirm the name/role card is gone, Site/Log out buttons
   still work.
