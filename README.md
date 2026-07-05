# Kill Animations

Manifest v2 browser extension that kills most web animations and transitions. Speed up the modern web again.

## Context

The modern web loves animations and transitions. Why immediately get a visual response after clicking a button when you can instead wait for a slow animation to complete? *"Slick design"* ™ or whatever, as webdevs like to call it. Bonus points for ignoring `prefers-reduced-motion`.

I want UIs to always respond immediately. I don't care about fade-in, ease-in and all the other *fancy* animations and effects. Stop wasting my time. If I click a button I want to immediately (0 seconds) see a result.

## Target Audience

- people that hate slow animations or animations in general
- people that get physically ill from animations
- people with vestibular disorders

## Technical

- bypasses CSP as this is a Manifest v2 extension, injection should theoretically work everywhere.\
  I tested some websites that aggressively block 3rd party content and this extension works there without issues.
- injects CSS to kill animations in a way that `animationstart`, `animationend`, `transitionstart` and `transitionend` events are still fired, just way faster than before.
- stubs the `Animation` and `KeyframeEffect` classes to run callbacks immediately.\
  I tested this on a specific website that has annoyingly slow transition animations in a custom tab widget. it killed the transition animation and made the UI respond immediately.
- stubs `requestAnimationFrame` and `cancelAnimationFrame` to bind them to the JavaScript VM scheduler (`setTimeout(callback, 0)`) instead of the monitor refresh rate.

## Offenders

The extension is written in a way that the following offenders **should still function**. Please open an issue when you discover a website that breaks in funny ways with this extension installed.

- Business logic gated behind animation timers/events; violating the fact that animations are purely cosmetic.

## Known Limitations

- This extension can't bypass hardcoded JavaScript animations that directly manipulate DOM element coordinates.
