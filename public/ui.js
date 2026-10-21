const toggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#mobile-navigation");
function closeMenu() { if (!navigation) return; navigation.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
toggle?.addEventListener("click", () => { navigation.hidden = !navigation.hidden; toggle.setAttribute("aria-expanded", String(!navigation.hidden)); });
navigation?.addEventListener("click", (event) => { if (event.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && navigation && !navigation.hidden) { closeMenu(); toggle.focus(); } });
document.addEventListener("click", (event) => { if (!event.target.closest(".header")) closeMenu(); });
matchMedia("(min-width: 801px)").addEventListener("change", closeMenu);
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
let motionOverride = false;
try { motionOverride = localStorage.getItem("ecomed-motion") === "enabled"; } catch {}
document.documentElement.classList.toggle("motion-enabled", motionOverride);
const motionButton = document.createElement("button");
motionButton.type = "button";
motionButton.className = "motion-control";
motionButton.textContent = "Ativar animações suaves";
motionButton.hidden = !motionPreference.matches || motionOverride;
document.querySelector("footer")?.append(motionButton);
motionButton.addEventListener("click", () => {
  document.documentElement.classList.add("motion-enabled");
  try { localStorage.setItem("ecomed-motion", "enabled"); } catch {}
  motionButton.hidden = true;
  enableReveals();
});
function enableReveals() {
if ("IntersectionObserver" in window) {
  const targets = [...document.querySelectorAll(".hero-photo, .cards article, .safe-grid article, .values article, .process article, .finder-heading, .search-panel, .simulator, .about > *, .faq details, .notice")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
  targets.forEach((element, index) => { element.style.setProperty("--reveal-delay", (index % 3) * 90 + "ms"); element.classList.add("reveal-pending"); observer.observe(element); });
  motionPreference.addEventListener("change", () => { targets.forEach((element) => element.classList.add("is-visible")); observer.disconnect(); });
  document.addEventListener("focusin", (event) => { event.target.closest(".reveal-pending")?.classList.add("is-visible"); });
}
}
if (!motionPreference.matches || motionOverride) enableReveals();
