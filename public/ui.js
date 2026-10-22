// Motion is enabled by default for this experience. Visitors can turn it off.
const root = document.documentElement;
let reduced = false;
try { reduced = localStorage.getItem("ecomed-motion") === "disabled"; } catch {}
root.classList.toggle("motion-disabled", reduced);
root.classList.toggle("motion-enabled", !reduced);

const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#mobile-navigation");
function closeMenu() {
  if (!navigation || navigation.hidden) return;
  navigation.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
}
toggle?.addEventListener("click", () => {
  navigation.hidden = !navigation.hidden;
  toggle.setAttribute("aria-expanded", String(!navigation.hidden));
});
navigation?.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && navigation && !navigation.hidden) { closeMenu(); toggle.focus(); }
});
document.addEventListener("click", event => { if (!event.target.closest(".header")) closeMenu(); });
const desktop = matchMedia("(min-width: 801px)");
if (desktop.addEventListener) desktop.addEventListener("change", closeMenu);
else desktop.addListener(closeMenu);

const motionButton = document.createElement("button");
motionButton.type = "button";
motionButton.className = "motion-control";
function labelMotion() {
  motionButton.textContent = reduced ? "Ativar animações" : "Reduzir animações";
  motionButton.setAttribute("aria-pressed", String(reduced));
}
labelMotion();
document.querySelector("footer")?.append(motionButton);
motionButton.addEventListener("click", () => {
  reduced = !reduced;
  root.classList.toggle("motion-disabled", reduced);
  root.classList.toggle("motion-enabled", !reduced);
  try { localStorage.setItem("ecomed-motion", reduced ? "disabled" : "enabled"); } catch {}
  labelMotion();
  if (reduced) document.querySelectorAll(".reveal-pending").forEach(el => el.classList.add("is-visible"));
});

// Animate children instead of a whole tall section: even a 320px viewport reveals them.
const targets = [...document.querySelectorAll(
  ".orientation > .eyebrow, .orientation > h2, .orientation > .section-intro, .cards article, .safe-grid article, .values article, .process article, .finder-heading, .search-panel, .results, .container-section > div, .about > *, .faq details, .notice, .policy > h2, footer > *"
)];
targets.forEach((element, index) => {
  element.style.setProperty("--reveal-delay", (index % 3) * 110 + "ms");
  element.classList.add("reveal-pending");
});
function show(element) { element.classList.add("is-visible"); }
if ("IntersectionObserver" in window && !reduced) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { show(entry.target); observer.unobserve(entry.target); } });
  }, { threshold: 0, rootMargin: "0px 0px -16px 0px" });
  // Two frames ensure the browser paints a start state before transitioning.
  requestAnimationFrame(() => requestAnimationFrame(() => targets.forEach(el => observer.observe(el))));
} else if (!reduced) {
  const reveal = () => targets.forEach(el => { if (el.getBoundingClientRect().top < innerHeight - 16) show(el); });
  addEventListener("scroll", reveal, { passive: true });
  requestAnimationFrame(reveal);
} else targets.forEach(show);
document.addEventListener("focusin", event => {
  const parent = event.target.closest(".reveal-pending");
  if (parent) show(parent);
});

// Keep native wheel/touch scrolling. Animate anchor navigation with a consistent ease.
let scrollFrame;
function cancelScroll() { cancelAnimationFrame(scrollFrame); root.classList.remove("scroll-in-progress"); }
["wheel", "touchstart", "pointerdown"].forEach(type => addEventListener(type, cancelScroll, { passive: true }));
addEventListener("keydown", cancelScroll);
document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const id = link.getAttribute("href").slice(1);
  const destination = document.getElementById(id);
  if (!destination) return;
  event.preventDefault();
  cancelScroll();
  const start = window.scrollY;
  const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
  const end = Math.max(0, Math.min(start + destination.getBoundingClientRect().top - headerHeight - 18, document.documentElement.scrollHeight - innerHeight));
  const duration = reduced ? 0 : Math.min(1700, Math.max(900, Math.abs(end - start) * .45));
  root.classList.add("scroll-in-progress");
  const started = performance.now();
  function finish() {
    root.classList.remove("scroll-in-progress");
    history.replaceState(null, "", "#" + id);
    if (!destination.hasAttribute("tabindex")) destination.setAttribute("tabindex", "-1");
    destination.focus({ preventScroll: true });
  }
  function step(now) {
    const progress = duration ? Math.min((now - started) / duration, 1) : 1;
    const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo(0, start + (end - start) * eased);
    if (progress < 1) scrollFrame = requestAnimationFrame(step);
    else finish();
  }
  scrollFrame = requestAnimationFrame(step);
});

// Pointer feedback also runs on touch screens, which have no hover state.
document.addEventListener("pointerdown", event => {
  const button = event.target.closest(".button, .menu-toggle, .motion-control");
  if (!button || reduced || button.disabled) return;
  const bounds = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "button-ripple";
  ripple.setAttribute("aria-hidden", "true");
  ripple.style.left = event.clientX - bounds.left + "px";
  ripple.style.top = event.clientY - bounds.top + "px";
  button.append(ripple);
  setTimeout(() => ripple.remove(), 950);
});

const progressBar = document.createElement("div");
progressBar.className = "reading-progress";
progressBar.setAttribute("aria-hidden", "true");
document.body.append(progressBar);
let scheduled = false;
function updateProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.transform = "scaleX(" + (distance > 0 ? window.scrollY / distance : 0) + ")";
  document.querySelector(".header")?.classList.toggle("has-scrolled", window.scrollY > 24);
  scheduled = false;
}
addEventListener("scroll", () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); } }, { passive: true });
updateProgress();
