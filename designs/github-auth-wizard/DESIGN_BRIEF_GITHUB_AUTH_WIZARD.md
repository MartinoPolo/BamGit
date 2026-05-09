> **Final design**: `claude_design/mockups/github-auth-wizard/final.html`
> **Adopted components**: Alert (shadcn-svelte)

# GitHub Auth Wizard — Design Spec

Design spec for the GitHub OAuth Device Flow authentication wizard. Replaces the `gh` CLI install requirement with a browser-based code entry flow. The wizard launches from the GhSetupBanner or Settings page and walks the user through: see code → open GitHub → wait for confirmation → connected. Hand this to a designer for visual exploration.

## Design Tokens

Use the Grovekeeper Forest Moss palette from `tokens.css`. Font: Geist / Geist Mono. GitHub brand color `#24292f` / `#f6f8fa` for the GitHub mark/icon only (not as a theme color).

## Wizard Purpose

GitHub authentication is a one-time setup that unlocks all GitHub features (issues, PRs, repo sync). Non-technical users should never see a terminal command or CLI install prompt. The Device Flow is inherently simple — show a code, send user to a URL, poll until done — but the UX must handle the awkward polling wait gracefully. The user leaves the app, authenticates in their browser, and returns. The wizard must feel alive during this wait and celebrate success clearly.

## Required Elements

### Code Display

- **User code**: 8-character alphanumeric code in `XXXX-XXXX` format (hyphen-separated halves)
- Display in large monospace type — this is the hero element of the wizard
- **Copy button**: one-click copy to clipboard with confirmation feedback (checkmark or "Copied!")
- Code is read-only — the user enters it on GitHub's site, not here
- Show the code at all times during polling (user may need to re-read it)

### Verification URL

- Display `github.com/login/device` as a clickable/tappable link
- **"Open GitHub" button**: `.gk-btn-primary`, opens the URL in default browser via Tauri shell
- Brief instruction text: "Enter the code above at GitHub to connect your account"

### Countdown Timer

- Device codes expire after ~15 minutes (server-provided `expires_in`)
- Show remaining time as `MM:SS` countdown
- Visual urgency shift: normal color for >5 min, `--status-warning` for 2-5 min, `--status-danger` for <2 min
- On expiry: show "Code expired" with a "Get New Code" `.gk-btn-secondary` to restart

### Polling State

- Spinner/animation indicating active polling (app is checking every 5s)
- Status text: "Waiting for you to enter the code on GitHub..."
- The wizard must feel alive — not frozen or stuck
- No user action needed during polling; all buttons except "Cancel" are passive

### Success State

- **Username**: fetched from GitHub API after token received
- **Avatar**: GitHub profile picture, circular, ~48-64px
- **Auth method badge**: `.gk-badge-success` showing "OAuth" or "Connected via OAuth"
- Brief success message: "Connected as {username}"
- **"Done" button**: `.gk-btn-primary` to dismiss the wizard
- Consider: brief celebration animation (`.gk-glow` or similar)

### Error States

- **Polling timeout** (code expired before user authenticated): Show expiry message + "Try Again" button
- **Access denied** (user clicked "Cancel" on GitHub's auth page): "Authorization was denied" + "Try Again"
- **Network error** (polling request failed): "Connection error — retrying..." with auto-retry
- **Scope error** (token missing required scopes): "Missing permissions — please try again and accept all requested scopes"

### Cancel / Disconnect

- **Cancel button**: `.gk-btn-ghost` available at all times during the flow. Cancels polling, dismisses wizard
- **Disconnect button**: shown in connected state (settings page). `.gk-btn-danger` "Disconnect GitHub". Confirmation required before clearing token

### Settings Integration

- Settings page shows a "GitHub" section with:
  - **Not connected**: "Connect to GitHub" `.gk-btn-primary` launches the wizard
  - **Connected**: avatar + username + "Connected via OAuth" badge + "Disconnect" button
  - **Toggle**: `.gk-toggle` "Use gh CLI instead of built-in auth" for power users (hidden when `gh` CLI not detected)

## Reusable Components

- `Dialog`: `.gk-modal` for Variant A (centered modal with backdrop)
- `Sheet`: for Variant C (slide-in panel)
- `Button`: `.gk-btn-primary` for CTAs, `.gk-btn-ghost` for cancel, `.gk-btn-danger` for disconnect
- `Badge`: `.gk-badge-success` for connected status, `.gk-badge-warning` for timer warnings
- `InputOTP` (to adopt): for the code display — 8 slots split into two groups of 4 with separator, read-only mode
- `Switch`: `.gk-toggle` for the CLI fallback preference
- `Card`: `.gk-card` for Variant B inline card
- `Separator`: between settings sections
- `Tooltip`: for CLI toggle explanation

## Components to Adopt

- **InputOTP** from shadcn-svelte — perfect for displaying the `XXXX-XXXX` device code in a visually distinct, slot-based format. Use in read-only/display mode (not editable). `maxlength={8}`, `REGEXP_ONLY_DIGITS_AND_CHARS`.
- **Progress** from shadcn-svelte — for the countdown timer as a visual progress bar (optional, complements the `MM:SS` text)
- **Alert** from shadcn-svelte — for error states (expired code, denied access, network errors)

## Layout Constraints

- Dialog (Variant A): 420-480px wide, height flexible (~300-400px depending on phase)
- Inline card (Variant B): full parent width, ~200px tall, responsive
- Sheet (Variant C): 380px wide, full height, right-anchored
- Code display: minimum 32px font size, Geist Mono, `letter-spacing: 0.15em`
- Avatar in success state: 48px circular
- Timer: 14px monospace, right-aligned or below code
- All variants must work at 1024px minimum viewport width

## States to Explore in Variants

For the initial three variants, show the **polling state** — this is the most common view (user is away authenticating):
- Code `ABCD-1234` displayed prominently
- Timer at ~12:30 remaining (healthy)
- Spinner active
- "Waiting for you to enter the code on GitHub..." text
- "Open GitHub" button still available (in case user needs to re-open)
- Cancel button visible

States to design after variant selection:
- Initial state (code just generated, timer full, no polling yet)
- Timer warning state (<2 min remaining, danger colors)
- Code expired state (timer at 0, "Get New Code" button)
- Success state (avatar + username + celebration)
- Access denied error
- Network error with retry
- Settings page: not connected
- Settings page: connected with OAuth
- Settings page: connected with gh CLI (shows toggle)
- GhSetupBanner: updated to show "Connect to GitHub" instead of CLI instructions

## Visual References

- `src/lib/components/GhSetupBanner.svelte` — current CLI-centric banner to be replaced/updated
- `src/lib/components/UserAvatar.svelte` — avatar display pattern for connected state
- GitHub's own device flow page (`github.com/login/device`) — the wizard should feel complementary, not redundant with what GitHub shows
- `claude_design/design_briefs/SESSION_SPAWNING_DIALOG.md` — dialog-based wizard pattern reference
- `claude_design/design_briefs/BULK_IMPORT_WIZARD.md` — multi-step flow reference

## UI Freedom

- Whether the code uses InputOTP slots or a large styled text block — both valid approaches
- Animation style during polling (spinner, pulsing dots, progress ring, sway animation)
- Whether success auto-dismisses or requires explicit "Done" click
- QR code inclusion (Variant B suggests it — optional, nice for mobile-first users)
- Whether the timer is a text countdown, a progress bar, a ring, or a combination
- How aggressively to celebrate success (subtle fade vs confetti vs glow)
- Exact placement of the wizard trigger in settings (own section vs part of "Account" section)

## Not Included

- GitHub App / installation-based auth (out of scope per issue)
- OAuth PKCE web flow (Device Flow chosen instead)
- Token refresh UI (handled automatically in background by Rust backend)
- Multiple GitHub account support (single account only)
- Organization-level permissions UI (scopes are fixed: repo, read:org, read:user)
- `gh` CLI installation guide (stays as a link for fallback users)
