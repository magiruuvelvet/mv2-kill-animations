(function() {

// NOTES:
// - preserve the original name when overwriting W3C classes and functions
// - use actual privates (#) for internal helper properties and methods
// - shadow all `toString` methods with the `create_to_string_func` function

let raf_id_counter = 0;
const raf_pending = new Map();
const nagged = new Set();

// hide custom implementation by pretending to be browser native code
function create_to_string_func(func) {
    const toString = function() {
        return `function ${func}() {\n    [native code]\n}`;
    };
    toString.toString = () => `function toString() {\n    [native code]\n}`;
    return toString;
}
create_to_string_func.toString = create_to_string_func("toString");

// nagging function for debugging
function nag(func) {
    // nagging disabled in production
    return;

    if (!nagged.has(func)) {
        nagged.add(func);

        const msg = `animation-api-stub: ${func} called while (prefers-reduced-motion: reduce) is active. consider supporting proper accessibility standards.`;
        console.error(msg);
        window.reportError(new Error(msg));
    }
}
nag.toString = create_to_string_func("nag");

window.requestAnimationFrame = function(callback) {
    nag("window.requestAnimationFrame");

    const id = ++raf_id_counter;

    // nested shadow with identical name
    function requestAnimationFrame() {
        raf_pending.delete(id);
        callback(performance.now());
    }
    requestAnimationFrame.toString = create_to_string_func("requestAnimationFrame");

    raf_pending.set(id, setTimeout(requestAnimationFrame, 0));
    return id;
};
window.requestAnimationFrame.toString = create_to_string_func("requestAnimationFrame");

window.cancelAnimationFrame = function(id) {
    nag("window.cancelAnimationFrame");

    const timer = raf_pending.get(id);
    if (timer !== undefined) {
        clearTimeout(timer);
        raf_pending.delete(id);
    }
};
window.cancelAnimationFrame.toString = create_to_string_func("cancelAnimationFrame");

class Animation {
    #delegate = new EventTarget();
    #finish_fired = false;
    #cancelled = false;

    constructor() {
        nag("window.Animation constructor");

        this.currentTime = 0;
        this.effect = null;
        this.id = "";
        this.oncancel = null;
        this.onfinish = null;
        this.onremove = null;
        this.pending = false;
        this.playState = "finished";
        this.playbackRate = 1;
        this.replaceState = "active";
        this.startTime = 0;
        this.timeline = null;

        this.finished = Promise.resolve(this);
        this.ready = Promise.resolve(this);

        // fire finish as a microtask - gives callers one synchronous tick to
        // set onfinish or call addEventListener("finish") after animate() returns
        Promise.resolve().then(() => this.#maybe_dispatch_finish());
    }

    cancel() {
        if (this.#cancelled || this.#finish_fired) {
            return;
        }

        this.#cancelled = true;
        this.playState = "idle";
        const ev = new AnimationPlaybackEvent("cancel", { currentTime: 0, timelineTime: null });
        this.#delegate.dispatchEvent(ev);

        if (this.oncancel) {
            this.oncancel(ev);
        }
    }

    // fires finish immediately rather than waiting for the scheduled microtask
    finish() {
        this.#maybe_dispatch_finish();
    }

    commitStyles() {}
    pause() {}
    persist() {}
    play() {}
    reverse() {}
    updatePlaybackRate() {}

    addEventListener(type, listener, options) {
        this.#delegate.addEventListener(type, listener, options);
    }

    removeEventListener(type, listener, options) {
        this.#delegate.removeEventListener(type, listener, options);
    }

    dispatchEvent(ev) {
        return this.#delegate.dispatchEvent(ev);
    }

    #maybe_dispatch_finish() {
        if (this.#finish_fired || this.#cancelled) {
            return;
        }

        this.#finish_fired = true;
        const ev = new AnimationPlaybackEvent("finish", { currentTime: 0, timelineTime: null });
        this.#delegate.dispatchEvent(ev);

        if (this.onfinish) {
            this.onfinish(ev);
        }
    }
}
Animation.toString = create_to_string_func("Animation");
Animation.prototype.cancel.toString = create_to_string_func("cancel");
Animation.prototype.finish.toString = create_to_string_func("finish");
Animation.prototype.commitStyles.toString = create_to_string_func("commitStyles");
Animation.prototype.pause.toString = create_to_string_func("pause");
Animation.prototype.persist.toString = create_to_string_func("persist");
Animation.prototype.play.toString = create_to_string_func("play");
Animation.prototype.reverse.toString = create_to_string_func("reverse");
Animation.prototype.updatePlaybackRate.toString = create_to_string_func("");
Animation.prototype.addEventListener.toString = create_to_string_func("addEventListener");
Animation.prototype.removeEventListener.toString = create_to_string_func("removeEventListener");
Animation.prototype.dispatchEvent.toString = create_to_string_func("dispatchEvent");

// stub for KeyframeEffect so that new Animation(new KeyframeEffect(...), ...)
// does not produce a real animation effect
class KeyframeEffect {
    constructor(target) {
        nag("window.KeyframeEffect constructor");

        this.target = target;
        this.pseudoElement = null;
        this.composite = "replace";
        this.iterationComposite = "replace";
    }

    getComputedTiming() { return {}; }
    getTiming() { return {}; }
    getKeyframes() { return []; }
    setKeyframes() {}
    updateTiming() {}
}
KeyframeEffect.toString = create_to_string_func("KeyframeEffect");
KeyframeEffect.prototype.getComputedTiming.toString = create_to_string_func("getComputedTiming");
KeyframeEffect.prototype.getTiming.toString = create_to_string_func("getTiming");
KeyframeEffect.prototype.getKeyframes.toString = create_to_string_func("getKeyframes");
KeyframeEffect.prototype.setKeyframes.toString = create_to_string_func("setKeyframes");
KeyframeEffect.prototype.updateTiming.toString = create_to_string_func("updateTiming");

window.Animation = Animation;
window.KeyframeEffect = KeyframeEffect;

Element.prototype.animate = function() {
    nag("Element.prototype.animate");

    return new Animation();
};
Element.prototype.animate.toString = create_to_string_func("animate");

Document.prototype.getAnimations = function() { return []; };
Document.prototype.getAnimations.toString = create_to_string_func("getAnimations");
Element.prototype.getAnimations = function() { return []; };
Element.prototype.getAnimations.toString = create_to_string_func("getAnimations");

// NOTES:
// - a duration of `0s` is not possible without writing a bunch of complicated and fragile JavaScript code
// - ditto when forcing `animation` and `transition` to `none`;
//   the original animation/transition properties must stay as-is unfortunately
// - use the `:not(#\#)` trick to gain higher specificity than !important inline styles
// - set some popular framework variables in the :root in case of @scoped styles
const style =
`*, *:not(#\\#), *:not(#\\#):not(#\\#), *::after, *::before {
  animation-duration: 0.001ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
}

:root {
  --transition-duration: 0.001ms !important;
  --animation-duration: 0.001ms !important;
  --transition-speed: 0.001ms !important;
  --animation-speed: 0.001ms !important;
  --duration-slow: 0.001ms !important;
  --duration-medium: 0.001ms !important;
  --duration-fast: 0.001ms !important;
  --duration-instant: 0.001ms !important;
  --mdc-animation-duration: 0.001ms !important;
  --mat-transition-duration: 0.001ms !important;
  --bs-transition-duration: 0.001ms !important;
}

@media (prefers-reduced-motion: reduce) {
  *, *:not(#\\#), *:not(#\\#):not(#\\#), *::after, *::before {
    animation-duration: 0.001ms !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
}`;

function create_style() {
    const element = document.createElement("style");
    element.textContent = style;
    return element;
}

// injection points:
// - first element inside <head>
// - last element inside <html>
document.addEventListener("DOMContentLoaded", () => {
    document.getElementsByTagName("head")?.[0]?.prepend(create_style());
    document.getElementsByTagName("html")?.[0]?.append(create_style());
}, true);

})();
