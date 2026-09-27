import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metaForPath } from "../../server/seo-pages.mjs";

function ensureMeta(name: string, attr: "name" | "property" = "name") {
  const selector = `meta[${attr}="${name}"]`;
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attr, name);
    document.head.appendChild(node);
  }
  return node;
}

export function DocumentMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = metaForPath(pathname);
    document.title = meta.title;
    ensureMeta("description").setAttribute("content", meta.description);
    ensureMeta("robots").setAttribute("content", meta.robots);
    ensureMeta("og:title", "property").setAttribute("content", meta.title);
    ensureMeta("og:description", "property").setAttribute("content", meta.description);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (meta.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", meta.canonical);
    } else if (canonical) {
      canonical.remove();
    }
  }, [pathname]);
  return null;
}
