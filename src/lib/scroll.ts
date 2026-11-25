/**
 * An eased scroll to a page offset. The browser's own smooth scroll is
 * near-instant over long distances in some engines, so this drives it: the
 * duration grows with the distance (0.6–1.2 s), and any wheel, touch or key
 * input from the visitor hands control straight back to them.
 */
export function easeScrollTo(target: number) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const end = Math.max(0, Math.min(target, max));
  const start = window.scrollY;
  const distance = end - start;
  if (Math.abs(distance) < 1) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: end, behavior: "instant" });
    return;
  }

  const duration = Math.min(1200, Math.max(600, Math.abs(distance) * 0.25));
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  // Each step is placed exactly; CSS smooth scrolling would smooth it again.
  html.style.scrollBehavior = "auto";

  let frame = 0;
  const begin = performance.now();
  const stop = () => {
    cancelAnimationFrame(frame);
    html.style.scrollBehavior = previous;
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };

  const step = (now: number) => {
    const t = Math.min(1, (now - begin) / duration);
    // easeInOutCubic: gentle start, quick middle, soft landing.
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    window.scrollTo({ top: start + distance * e, behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  frame = requestAnimationFrame(step);
}

/** Back to the top of the page, eased. */
export function scrollToTop() {
  easeScrollTo(0);
}

/**
 * Eases to an element where a jump to its #hash would land it, honouring the
 * page's scroll-padding-top and the element's own scroll-margin-top.
 * Returns false if there is no such element, so the link can do its default.
 */
export function scrollToHash(hash: string) {
  const el = document.getElementById(decodeURIComponent(hash.replace(/^#/, "")));
  if (!el) return false;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  easeScrollTo(el.getBoundingClientRect().top + window.scrollY - padding - margin);
  if (window.location.hash !== `#${el.id}`) history.pushState(null, "", `#${el.id}`);
  return true;
}
