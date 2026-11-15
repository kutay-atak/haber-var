// Node ESM loader for the unit tests: resolves "@/…" to src/, replaces the
// modules that talk to the outside world (Supabase admin client, Web Push)
// with the in-memory fakes under tests/unit/fakes, and neutralises "server-only".
// Registered by register.mjs; TypeScript sources run with --experimental-strip-types.
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const FAKES = path.join(ROOT, "tests/unit/fakes");

const STUBS = {
  "@/lib/supabase/admin": path.join(FAKES, "supabase-admin.ts"),
  "@/lib/push": path.join(FAKES, "push.ts"),
};

const tryFile = (base) => [".ts", ".tsx", "/index.ts"].map((ext) => base + ext).find(existsSync);

export async function resolve(specifier, context, next) {
  if (specifier in STUBS) return next(pathToFileURL(STUBS[specifier]).href, context);
  if (specifier === "server-only") return { url: "data:text/javascript,", shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const file = tryFile(path.join(SRC, specifier.slice(2)));
    if (file) return next(pathToFileURL(file).href, context);
  } else if (specifier.startsWith(".") && !path.extname(specifier) && context.parentURL) {
    const file = tryFile(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (file) return next(pathToFileURL(file).href, context);
  }
  return next(specifier, context);
}
