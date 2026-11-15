# Accessibility

Haber Var is meant for groups that include grandparents as well as teenagers, so the app should be usable without a mouse, with a screen reader, and with low vision. This page describes where it stands today, honestly.

## Commitment

- Target: [WCAG 2.1](https://www.w3.org/TR/WCAG21/) level AA for the application screens (sign-in, groups, answering, settings).
- The nine newspaper templates are decorative by design; the goal there is that every piece of content is reachable and readable, even if the typography is expressive.

## What is in place

- Semantic HTML: headings in order, landmarks, lists for lists, buttons for actions and links for navigation.
- Every form control has a visible label; errors are announced with `role="alert"`.
- Toggle switches use `role="switch"` with `aria-checked`; reactions use `aria-pressed`; icon-only buttons carry `aria-label`.
- Keyboard: all interactive elements are reachable with Tab and show a visible focus ring.
- Standard buttons are at least 44 px tall; small secondary buttons (36 px) are kept for low-stakes actions such as "Later".
- Text can be enlarged in the browser; layouts use relative units and container queries, and the newspaper offers three text sizes in the design studio.
- Photos carry alternative text derived from the question and author; decorative emoji are hidden from assistive technology with `aria-hidden`.
- Both languages (Turkish, English) are available for the interface and for emails.

## Known limitations

- The newspaper templates have **not been audited with a screen reader**. Reading order should follow the content order, but columns, drop caps and hyphenation have not been verified with VoiceOver, TalkBack or NVDA.
- Colour contrast has not been measured for all 15 palettes combined with all 9 templates; some decorative combinations (for example light text on the *Retro Zine* sunburst) may fall below 4.5:1.
- Charts in poll results convey the ranking visually; the accessible text gives the counts, but not yet a full data table.
- The in-browser voice recorder relies on the browser's own microphone permission UI, which varies between devices.
- `prefers-reduced-motion` disables the global animations, but the design studio's live preview and the reaction picker still have small transitions that have not been reviewed individually.

## Supported environments

Developed and checked in current Chrome (desktop and Android) and Safari on iPhone, which is what the live group uses. Firefox and Samsung Internet are expected to work but have not been tested systematically. The app is a web app and does not require an app store.

## Reporting a barrier

If something in Haber Var is hard or impossible for you to use, please open an issue with the **Accessibility** label and tell us: the screen, the device and assistive technology you use, and what happened. Barriers are prioritised like bugs, not like feature requests.
