import createClient from "openapi-fetch";
import type { paths } from "./types";

// Важливо: baseUrl БЕЗ /v1, бо в OpenAPI paths зазвичай вже містять /v1/...
export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
});