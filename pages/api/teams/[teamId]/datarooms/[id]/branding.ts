import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  DataroomCardLayout,
  DataroomLogoPosition,
  DataroomRoundness,
} from "@prisma/client";
import { del } from "@vercel/blob";
import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

type LayoutPayload = {
  logo?: string | null;
  secondaryLogo?: string | null;
  banner?: string | null;
  brandColor?: string;
  accentColor?: string;
  applyAccentColorToDataroomView?: boolean;
  welcomeMessage?: string;
  logoPosition?: DataroomLogoPosition;
  cardLayout?: DataroomCardLayout;
  roundness?: DataroomRoundness;
  sidebarEnabled?: boolean;
  sidebarContent?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

const LOGO_POSITIONS = ["TOP_LEFT", "TOP_CENTER", "SPLIT"] as const;
const CARD_LAYOUTS = ["GRID", "LIST", "COMPACT"] as const;
const ROUNDNESS_VALUES = ["NONE", "MEDIUM", "LARGE"] as const;

function pickEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined;
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId, id: dataroomId } = req.query as {
    teamId: string;
    id: string;
  };

  try {
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: (session.user as CustomUser).id,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return res.status(403).end("Unauthorized to access this team");
    }

    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res.status(404).end("Dataroom not found");
    }
  } catch (error) {
    errorhandler(error, res);
  }

  if (req.method === "GET") {
    // GET /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findUnique({
      where: {
        dataroomId,
      },
    });

    if (!brand) {
      return res.status(200).json(null);
    }

    return res.status(200).json(brand);
  } else if (req.method === "POST") {
    // POST /api/teams/:teamId/datarooms/:id/branding
    const body = req.body as LayoutPayload;

    const brand = await prisma.dataroomBrand.create({
      data: {
        logo: body.logo ?? undefined,
        secondaryLogo: body.secondaryLogo ?? undefined,
        banner: body.banner ?? undefined,
        brandColor: body.brandColor,
        accentColor: body.accentColor,
        applyAccentColorToDataroomView: !!body.applyAccentColorToDataroomView,
        welcomeMessage: body.welcomeMessage,
        logoPosition: pickEnum(body.logoPosition, LOGO_POSITIONS),
        cardLayout: pickEnum(body.cardLayout, CARD_LAYOUTS),
        roundness: pickEnum(body.roundness, ROUNDNESS_VALUES),
        sidebarEnabled: !!body.sidebarEnabled,
        sidebarContent: body.sidebarContent ?? undefined,
        ctaLabel: body.ctaLabel ?? undefined,
        ctaUrl: body.ctaUrl ?? undefined,
        dataroomId,
      },
    });

    return res.status(200).json(brand);
  } else if (req.method === "PUT") {
    // PUT /api/teams/:teamId/datarooms/:id/branding
    const body = req.body as LayoutPayload;

    const brand = await prisma.dataroomBrand.update({
      where: {
        dataroomId,
      },
      data: {
        logo: body.logo,
        secondaryLogo: body.secondaryLogo,
        banner: body.banner,
        brandColor: body.brandColor,
        accentColor: body.accentColor,
        applyAccentColorToDataroomView: !!body.applyAccentColorToDataroomView,
        welcomeMessage: body.welcomeMessage,
        logoPosition: pickEnum(body.logoPosition, LOGO_POSITIONS),
        cardLayout: pickEnum(body.cardLayout, CARD_LAYOUTS),
        roundness: pickEnum(body.roundness, ROUNDNESS_VALUES),
        sidebarEnabled: body.sidebarEnabled,
        sidebarContent: body.sidebarContent,
        ctaLabel: body.ctaLabel,
        ctaUrl: body.ctaUrl,
      },
    });

    return res.status(200).json(brand);
  } else if (req.method === "DELETE") {
    // DELETE /api/teams/:teamId/datarooms/:id/branding
    const brand = await prisma.dataroomBrand.findFirst({
      where: {
        dataroomId,
      },
      select: { id: true, logo: true, secondaryLogo: true, banner: true },
    });

    if (brand && brand.logo) {
      // delete the logo from vercel blob
      await del(brand.logo);
    }
    if (brand && brand.secondaryLogo) {
      await del(brand.secondaryLogo);
    }
    if (brand && brand.banner) {
      // delete the logo from vercel blob
      await del(brand.banner);
    }

    // delete the branding from database
    await prisma.dataroomBrand.delete({
      where: {
        id: brand?.id,
      },
    });

    return res.status(204).end();
  } else {
    // We only allow GET, POST, PUT, DELETE requests
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
