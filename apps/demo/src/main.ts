import { init } from "@vitalscope/sdk";

// Configure with ?siteKey=...&endpoint=... or VITE_SITE_KEY / VITE_ENDPOINT.
const params = new URLSearchParams(location.search);
const siteKey = params.get("siteKey") ?? import.meta.env.VITE_SITE_KEY ?? "";
const endpoint = params.get("endpoint") ?? import.meta.env.VITE_ENDPOINT ?? "";

const status = document.getElementById("status")!;
status.textContent = siteKey && endpoint ? `SDK started for ${siteKey}` : "No siteKey/endpoint set: SDK is idle.";

init({
  siteKey,
  endpoint,
  release: params.get("release") ?? "demo-1",
  routePattern: (path) => path.replace(/\/\d+(?=\/|$)/g, "/:id"),
  debug: true,
});

document.getElementById("slow")!.addEventListener("click", () => {
  const end = performance.now() + 300;
  while (performance.now() < end) {
    /* block the main thread on purpose to produce a slow INP */
  }
});

document.getElementById("shift")!.addEventListener("click", () => {
  // Browsers ignore layout shifts within 500 ms of a user input (they count as expected),
  // so the shift is delayed to be counted in CLS.
  setTimeout(() => {
    const box = document.createElement("div");
    box.style.cssText = "height:8rem;background:#fbbf24;margin:1rem 0";
    box.textContent = "Inserted without reserved space";
    document.getElementById("hero")!.before(box);
  }, 1000);
});
