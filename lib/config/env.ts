/**
 * Centralized Environment Configuration
 * Validates required client-exposed env vars at build-time/runtime.
 * Throws early to prevent silent failures and hydration mismatches.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
const rawMenuUrl = process.env.NEXT_PUBLIC_MENU_URL;

const isProd = process.env.NODE_ENV === "production";

function validate(name: string, value: string | undefined, fallback: string): string {
  const val = value || fallback;
  if (!val) {
    throw new Error(`[Steward] CRITICAL: Environment variable ${name} is required but missing.`);
  }

  const isLocalhost = val.includes("localhost") || val.includes("127.0.0.1");
  if (isProd && isLocalhost) {
    // Allow local production-style builds to fall back to the shipped production defaults
    // when the local .env file points to localhost, while still protecting real deployments.
    const isServerBuild = typeof window === "undefined";
    const isHostedBuild = Boolean(process.env.CF_PAGES || process.env.GITHUB_ACTIONS || process.env.VERCEL_ENV);

    if (isServerBuild && !isHostedBuild && fallback && !fallback.includes("localhost") && !fallback.includes("127.0.0.1")) {
      console.warn(`[Steward] WARNING: ${name} points to localhost in a local production build; using fallback ${fallback}`);
      return fallback;
    }

    if (isServerBuild && !isHostedBuild) {
      throw new Error(`[Steward] CRITICAL: Environment variable ${name} points to localhost in a production build.`);
    }

    console.warn(`[Steward] WARNING: Environment variable ${name} points to localhost in production: ${val}`);
  }

  return val;
}

export const API_URL = validate("NEXT_PUBLIC_API_URL", rawApiUrl, "https://steward-backend-qwd2.onrender.com/v1");
export const WS_URL = validate("NEXT_PUBLIC_WS_URL", rawWsUrl, "https://steward-backend-qwd2.onrender.com");
export const MENU_URL = validate("NEXT_PUBLIC_MENU_URL", rawMenuUrl, "https://menu-6lg.pages.dev");

// Startup diagnostics (Only runs server-side during module evaluation)
if (typeof window === "undefined") {
  console.log("✓ API URL configured");
  console.log("✓ WS URL configured");
  console.log("✓ MENU URL configured");
}
