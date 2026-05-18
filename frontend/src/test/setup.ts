import "@testing-library/jest-dom";
import { beforeAll } from "vitest";
import http from "http";

beforeAll(async () => {
  const checkLive = () =>
    new Promise<boolean>((resolve) => {
      const req = http.get("http://localhost:3000/health", (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      req.on("error", () => resolve(false));
      req.end();
    });

  const isLive = await checkLive();
  if (!isLive) {
    console.warn("⚠️  Backend HTTP/WS is not running. Some integration tests may be skipped or fail if they require a live connection.");
  }
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
