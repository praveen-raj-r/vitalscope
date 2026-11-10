# @praveen-raj/vitalscope

A tiny browser SDK that measures real-user Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and sends them to a [Vitalscope](https://github.com/praveen-raj-r/vitalscope) ingest endpoint. Under 5 KB gzipped, one dependency (`web-vitals`), and `init()` never throws.

## Install

```sh
npm install @praveen-raj/vitalscope
```

```ts
import { init } from "@praveen-raj/vitalscope";

init({
  siteKey: "vs_pub_...", // public key from your dashboard
  // endpoint: "https://your-vitalscope.example/api/ingest", // only if you host your own
});
```

Or without a bundler:

```html
<script src="https://unpkg.com/@praveen-raj/vitalscope/dist/vitalscope.global.js"></script>
<script>
  Vitalscope.init({ siteKey: "vs_pub_..." });
</script>
```

`endpoint` is optional. Without it the SDK sends to the hosted ingest at `https://vitalscope-rum.vercel.app/api/ingest`, which accepts events only for site keys created in that dashboard. If you host your own Vitalscope, set `endpoint` to your own URL.

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `siteKey` | `string` | required | Public site key from the dashboard. |
| `endpoint` | `string` | hosted ingest | Ingest URL. Set it to use your own deployment. |
| `sampleRate` | `number` (0 to 1) | `1` | Decided once per page view. |
| `release` | `string` | none | Build or version tag, used for release comparison. |
| `routePattern` | `(path) => string` | none | Normalise paths, e.g. `/b/123` to `/b/:id`. |
| `debug` | `boolean` | `false` | Log problems to the console. |

## What it sends

For each metric: name, value, rating, the page path, device class (mobile, tablet, desktop), connection type, your `release`, a random per-page-view id and a timestamp. For LCP, INP and CLS it adds a short attribution (the element's selector and, for LCP, the resource URL).

It sets no cookies, stores nothing in the browser and sends no user ids or page content. (Like any request, the server sees your visitor's IP address; Vitalscope does not store it.) The path is the pathname only; the query string and hash are dropped. The site key is public: the server accepts events only from the origins you allow for that site.

## Known limitation

INP attribution (`target`) can be missing for very fast interactions, because the browser does not always expose the element for them.

## License

MIT
