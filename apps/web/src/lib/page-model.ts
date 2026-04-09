import type { paths } from "@acme/openapi-client";
import { cache } from "react";

type PublicPageGet = paths["/v1/public/pages/{slug}"]["get"];
type PageModelResponse =
  NonNullable<NonNullable<PublicPageGet["responses"]["200"]>["content"]>["application/json"];

const API_URL = process.env.API_URL ?? "http://localhost:3000";

export const getHomePageModel = cache(async (): Promise<PageModelResponse> => {
  const url = new URL(`${API_URL}/v1/public/pages/home`);
  url.searchParams.set("locale", "uk");

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to load page model: ${res.status}`);
  return res.json() as Promise<PageModelResponse>;
});