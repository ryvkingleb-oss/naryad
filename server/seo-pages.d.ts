export const SITE_NAME: string;
export const SITE_ORIGIN: string;
export const redirects: Record<string, string>;

export interface ContentBlock {
  heading?: string;
  paragraphs?: string[];
  items?: string[];
  warn?: string;
}

export interface PageCta {
  to: string;
  label: string;
}

export interface PublicPage {
  path: string;
  title: string;
  description: string;
  h1: string;
  kicker?: string;
  lead?: string;
  blocks: ContentBlock[];
  supplements?: ContentBlock[];
  cta?: PageCta;
  secondaryCta?: PageCta;
  priority: string;
  changefreq: string;
}

export interface PageMeta {
  title: string;
  description: string;
  robots: string;
  canonical: string;
  path: string;
}

export function indexablePages(): PublicPage[];
export function stripPath(pathname: string): string;
export function redirectTarget(pathname: string): string | null;
export function pageByPath(pathname: string): PublicPage | undefined;
export function isPrivatePath(pathname: string): boolean;
export function metaForPath(pathname: string): PageMeta;
export function htmlStatus(pathname: string): number;
export function fallbackInnerHtml(page: PublicPage | undefined): string;
export function injectIndexHtml(template: string, pathname: string): string;
export function sitemapXml(): string;
export function robotsTxt(): string;
