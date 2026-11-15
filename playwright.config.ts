import { defineConfig, devices } from "@playwright/test";

// Browser tests run against a production build of the app with placeholder
// environment variables: only pages that need no database are covered
// (landing page, privacy page, the public design-studio demo).
// `npm run test:e2e` builds and starts the server itself; CI does the same.
const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // The app follows the browser language when no cookie is set; tests assume Turkish.
    locale: "tr-TR",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/gizlilik`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "placeholder",
      SUPABASE_SECRET_KEY: "placeholder",
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "demo",
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
    },
  },
});
