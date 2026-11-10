import { describe, expect, it } from "vitest";
import type { Metric } from "web-vitals";
import { pickAttribution, selectorOf } from "../src/attribution";

const m = (name: Metric["name"], entries: unknown[]) => ({ name, entries }) as unknown as Metric;
const rect = (w: number, h: number) => ({ width: w, height: h }) as DOMRectReadOnly;

describe("selectorOf", () => {
  it("builds a short path and stops at an id", () => {
    document.body.innerHTML = `<main id="app"><div class="hero big"><img class="logo"></div></main>`;
    expect(selectorOf(document.querySelector("img"))).toBe("main#app > div.hero > img.logo");
  });
  it("limits depth and handles missing nodes", () => {
    document.body.innerHTML = "<section><div><p><span><b>x</b></span></p></div></section>";
    expect(selectorOf(document.querySelector("b"))!.split(" > ")).toHaveLength(4);
    expect(selectorOf(null)).toBeUndefined();
    expect(selectorOf(document.createTextNode("t"))).toBeUndefined();
  });
});

describe("pickAttribution", () => {
  it("LCP: element selector and URL without query", () => {
    document.body.innerHTML = `<img id="hero">`;
    const out = pickAttribution(
      m("LCP", [{ element: document.querySelector("img"), url: "https://cdn.dev/h.jpg?token=s#x" }]),
    );
    expect(out).toEqual({ target: "img#hero", url: "https://cdn.dev/h.jpg" });
  });
  it("LCP: drops data: URLs", () => {
    expect(pickAttribution(m("LCP", [{ url: "data:image/png;base64,AAAA" }]))).toBeUndefined();
  });
  it("INP: target and type of the slowest event", () => {
    document.body.innerHTML = `<button id="a"></button><button id="b"></button>`;
    const [a, b] = Array.from(document.querySelectorAll("button"));
    const out = pickAttribution(
      m("INP", [
        { name: "pointerdown", duration: 40, target: a },
        { name: "click", duration: 300, target: b },
      ]),
    );
    expect(out).toEqual({ target: "button#b", eventType: "click" });
  });
  it("CLS: largest source of the worst shift", () => {
    document.body.innerHTML = `<p id="s"></p><p id="l"></p>`;
    const [s, l] = Array.from(document.querySelectorAll("p"));
    const out = pickAttribution(
      m("CLS", [
        { value: 0.01, sources: [{ node: s, currentRect: rect(1, 1) }] },
        {
          value: 0.2,
          sources: [
            { node: s, currentRect: rect(5, 5) },
            { node: l, currentRect: rect(50, 50) },
          ],
        },
      ]),
    );
    expect(out).toEqual({ target: "p#l" });
  });
  it("returns undefined for FCP/TTFB and empty entries", () => {
    expect(pickAttribution(m("FCP", []))).toBeUndefined();
    expect(pickAttribution(m("LCP", []))).toBeUndefined();
  });
});
