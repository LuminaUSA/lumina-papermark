import { useRouter } from "next/router";

import type { CSSProperties } from "react";

import {
  DataroomCardLayout,
  DataroomLogoPosition,
  DataroomRoundness,
} from "@prisma/client";

import { ViewFolderTree } from "@/components/datarooms/folders";
import DocumentCard from "@/components/view/dataroom/document-card";
import FolderCard from "@/components/view/dataroom/folder-card";
import {
  ViewerSurfaceThemeProvider,
  createViewerSurfaceTheme,
} from "@/components/view/viewer/viewer-surface-theme";

const DEFAULT_BANNER_IMAGE = "/_static/papermark-banner.png";

export default function ViewPage() {
  const router = useRouter();
  const {
    brandLogo,
    secondaryLogo,
    brandColor,
    brandBanner,
    accentColor,
    applyAccentColorToDataroomView,
    logoPosition: logoPositionParam,
    cardLayout: cardLayoutParam,
    roundness: roundnessParam,
    sidebarEnabled: sidebarEnabledParam,
    sidebarContent,
    ctaLabel,
    ctaUrl,
  } = router.query as {
    brandLogo?: string;
    secondaryLogo?: string;
    brandColor?: string;
    brandBanner?: string;
    accentColor?: string;
    applyAccentColorToDataroomView?: string;
    logoPosition?: string;
    cardLayout?: string;
    roundness?: string;
    sidebarEnabled?: string;
    sidebarContent?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };

  const logoPosition: DataroomLogoPosition =
    logoPositionParam === "TOP_CENTER" || logoPositionParam === "SPLIT"
      ? logoPositionParam
      : "TOP_LEFT";
  const cardLayout: DataroomCardLayout =
    cardLayoutParam === "GRID" || cardLayoutParam === "COMPACT"
      ? cardLayoutParam
      : "LIST";
  const roundness: DataroomRoundness =
    roundnessParam === "NONE" || roundnessParam === "LARGE"
      ? roundnessParam
      : "MEDIUM";
  const sidebarEnabled = sidebarEnabledParam === "1";
  const showSidebarCta = sidebarEnabled && !!ctaLabel && !!ctaUrl;
  const showNavCta = !sidebarEnabled && !!ctaLabel && !!ctaUrl;

  const radiusValue =
    roundness === "NONE" ? "0px" : roundness === "LARGE" ? "16px" : "8px";

  const shouldApplyAccentToDataroomView =
    applyAccentColorToDataroomView === "1";
  const dataroomViewBackgroundColor = shouldApplyAccentToDataroomView
    ? accentColor
    : "#ffffff";
  const previewSurfaceTheme = createViewerSurfaceTheme(
    dataroomViewBackgroundColor,
  );

  const itemListClassName =
    cardLayout === "GRID"
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : cardLayout === "COMPACT"
        ? "space-y-2"
        : "space-y-4";

  const renderPrimaryLogo = () =>
    brandLogo ? (
      <img className="w-full object-contain" src={brandLogo} alt="Logo" />
    ) : (
      <div className="text-2xl font-bold tracking-tighter text-white">
        Papermark
      </div>
    );

  return (
    <div
      className="min-h-screen bg-white"
      style={
        {
          backgroundColor: dataroomViewBackgroundColor,
          "--viewer-radius": radiusValue,
        } as CSSProperties
      }
    >
      {/* Nav */}
      <nav
        className="bg-black"
        style={{ backgroundColor: brandColor }}
      >
        <div className="mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div
              className={
                logoPosition === "TOP_CENTER"
                  ? "flex flex-1 items-center justify-center"
                  : "flex flex-1 items-center justify-start"
              }
            >
              <div className="relative flex h-16 w-36 flex-shrink-0 items-center overflow-y-hidden">
                {renderPrimaryLogo()}
              </div>
              {logoPosition === "SPLIT" && secondaryLogo && (
                <div className="ml-auto flex h-16 w-36 flex-shrink-0 items-center justify-end overflow-y-hidden">
                  <img
                    className="w-full object-contain"
                    src={secondaryLogo}
                    alt="Secondary logo"
                  />
                </div>
              )}
            </div>
            {showNavCta && (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-black"
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </div>

        {/* Banner section */}
        {brandBanner !== "no-banner" && (
          <div className="relative h-[30vh]">
            <img
              className="h-[30vh] w-full object-cover"
              src={brandBanner || DEFAULT_BANNER_IMAGE}
              alt="Banner"
              width={1920}
              height={320}
            />
            <div className="absolute bottom-5 w-fit rounded-r-md bg-white/30 backdrop-blur-md">
              <div className="px-5 py-2 sm:px-10">
                <div className="text-3xl">Example Data Room</div>
                <time className="text-sm">Last updated 2 hours ago</time>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Body */}
      <ViewerSurfaceThemeProvider value={previewSurfaceTheme}>
        <div
          style={
            {
              height: "calc(100vh - 64px)",
              "--viewer-radius": radiusValue,
            } as CSSProperties
          }
          className="relative flex"
        >
          {/* Left column: optional sidebar + folder tree */}
          <div
            className="hidden h-full shrink-0 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-4 md:block md:px-4 md:pt-6 lg:px-6 lg:pt-9 xl:px-8"
            style={{ width: "clamp(260px, 28vw, 440px)" }}
          >
            {sidebarEnabled && (sidebarContent || showSidebarCta) && (
              <div
                className="mb-6 border border-[var(--viewer-panel-border)] bg-[var(--viewer-panel-bg)] p-4"
                style={{
                  borderRadius: "var(--viewer-radius)",
                  borderColor: previewSurfaceTheme.palette.panelBorderColor,
                  backgroundColor: previewSurfaceTheme.palette.panelBgColor,
                }}
              >
                {sidebarContent && (
                  <p
                    className="whitespace-pre-wrap text-sm"
                    style={{ color: previewSurfaceTheme.palette.textColor }}
                  >
                    {sidebarContent}
                  </p>
                )}
                {showSidebarCta && (
                  <a
                    href={ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium text-white"
                    style={{
                      backgroundColor: brandColor || "#000000",
                      borderRadius: "var(--viewer-radius)",
                    }}
                  >
                    {ctaLabel}
                  </a>
                )}
              </div>
            )}
            <ViewFolderTree
              folders={[
                {
                  id: "1",
                  name: "Marketing",
                  parentId: null,
                  dataroomId: "1",
                  orderIndex: 0,
                  hierarchicalIndex: null,
                  path: "/",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  icon: null,
                  color: null,
                },
                {
                  id: "2",
                  name: "Sales",
                  parentId: null,
                  dataroomId: "1",
                  orderIndex: 1,
                  hierarchicalIndex: null,
                  path: "/",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  icon: null,
                  color: null,
                },
              ]}
              documents={[
                {
                  id: "1",
                  name: "Q4 Report.pdf",
                  dataroomDocumentId: "1",
                  folderId: null,
                  orderIndex: null,
                  hierarchicalIndex: null,
                  versions: [
                    {
                      id: "1",
                      versionNumber: 1,
                      hasPages: true,
                    },
                  ],
                },
              ]}
              setFolderId={() => {}}
              folderId={null}
            />
          </div>

          {/* Detail view */}
          <div className="flex-grow overflow-auto">
            <div className="h-full space-y-8 px-3 pb-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-9 xl:px-14">
              <div className="space-y-4">
                <div
                  className={`text-sm ${previewSurfaceTheme.usesLightText ? "text-white/70" : "text-muted-foreground"}`}
                >
                  Home
                </div>
                <ul className={itemListClassName}>
                  <li key="1">
                    <FolderCard
                      folder={{
                        id: "1",
                        name: "Marketing",
                        parentId: null,
                        dataroomId: "1",
                        orderIndex: 0,
                        hierarchicalIndex: null,
                        path: "/",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        icon: null,
                        color: null,
                      }}
                      dataroomId="1"
                      setFolderId={() => {}}
                      isPreview={false}
                      linkId="1"
                      allowDownload={false}
                      layout={cardLayout}
                    />
                  </li>

                  <li key="2">
                    <FolderCard
                      folder={{
                        id: "2",
                        name: "Sales",
                        parentId: null,
                        dataroomId: "1",
                        orderIndex: 1,
                        hierarchicalIndex: null,
                        path: "/",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        icon: null,
                        color: null,
                      }}
                      dataroomId="1"
                      setFolderId={() => {}}
                      isPreview={false}
                      linkId="1"
                      allowDownload={false}
                      layout={cardLayout}
                    />
                  </li>

                  <li key="3">
                    <DocumentCard
                      document={{
                        id: "1",
                        name: "Q4 Report.pdf",
                        dataroomDocumentId: "1",
                        downloadOnly: false,
                        canDownload: false,
                        hierarchicalIndex: null,
                        versions: [
                          {
                            id: "1",
                            type: "pdf",
                            versionNumber: 1,
                            hasPages: true,
                            isVertical: true,
                            updatedAt: new Date(),
                          },
                        ],
                      }}
                      linkId="1"
                      isPreview={false}
                      allowDownload={false}
                      layout={cardLayout}
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ViewerSurfaceThemeProvider>
    </div>
  );
}
