import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";

type BrandfetchResponse = {
  name?: string;
  domain?: string;
  logos?: Array<{
    type?: string;
    theme?: string;
    formats?: Array<{ src?: string; format?: string; background?: string }>;
  }>;
  colors?: Array<{ hex?: string; type?: string; brightness?: number }>;
  images?: Array<{
    type?: string;
    formats?: Array<{ src?: string; format?: string }>;
  }>;
};

function normalizeDomain(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Allow bare domains, full URLs, or with/without protocol
  try {
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function pickLogo(data: BrandfetchResponse): string | null {
  const logos = data.logos ?? [];
  // Prefer "logo" type, then "symbol", then "icon"
  const ranked = ["logo", "symbol", "icon", "other"];
  const sorted = [...logos].sort(
    (a, b) =>
      ranked.indexOf(a.type ?? "other") - ranked.indexOf(b.type ?? "other"),
  );
  for (const entry of sorted) {
    const formats = entry.formats ?? [];
    // Prefer SVG, then PNG
    const svg = formats.find((f) => f.format === "svg");
    if (svg?.src) return svg.src;
    const png = formats.find((f) => f.format === "png");
    if (png?.src) return png.src;
    const any = formats.find((f) => f.src);
    if (any?.src) return any.src;
  }
  return null;
}

function pickBanner(data: BrandfetchResponse): string | null {
  const banners = (data.images ?? []).filter(
    (img) => img.type === "banner" || img.type === "header",
  );
  for (const entry of banners) {
    const formats = entry.formats ?? [];
    const png = formats.find((f) => f.format === "png" || f.format === "jpg");
    if (png?.src) return png.src;
    const any = formats.find((f) => f.src);
    if (any?.src) return any.src;
  }
  return null;
}

function pickColor(
  data: BrandfetchResponse,
  preferred: string[],
): string | null {
  const colors = data.colors ?? [];
  for (const type of preferred) {
    const match = colors.find((c) => c.type === type);
    if (match?.hex) return match.hex;
  }
  return colors[0]?.hex ?? null;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "BRANDFETCH_API_KEY is not configured" });
  }

  const { url } = req.body as { url?: string };
  const domain = url ? normalizeDomain(url) : null;
  if (!domain) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const response = await fetch(
      `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    if (response.status === 404) {
      return res.status(404).json({ error: "Brand not found" });
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return res
        .status(502)
        .json({ error: "Brandfetch lookup failed", detail });
    }

    const data: BrandfetchResponse = await response.json();

    const logo = pickLogo(data);
    const banner = pickBanner(data);
    const brandColor = pickColor(data, ["brand", "primary", "dark"]);
    const accentColor = pickColor(data, ["accent", "light", "background"]);

    return res.status(200).json({
      domain,
      name: data.name ?? null,
      logo,
      banner,
      brandColor,
      accentColor,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: (error as Error).message || "Unknown error" });
  }
}
