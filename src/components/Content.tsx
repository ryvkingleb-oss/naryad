import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ContentBlock, PublicPage } from "../../server/seo-pages.mjs";
import { pageByPath } from "../../server/seo-pages.mjs";

export function Inline({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const label = match[1];
    const href = match[2];
    if (href.startsWith("/")) nodes.push(<Link key={index} to={href}>{label}</Link>);
    else if (href.startsWith("https://") || href.startsWith("mailto:")) nodes.push(<a key={index} href={href}>{label}</a>);
    else nodes.push(label);
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

export function Blocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => (
        <section className="prose-block" key={index}>
          {block.heading ? <h2>{block.heading}</h2> : null}
          {block.warn ? <p className="warn">{block.warn}</p> : null}
          {block.facts?.length ? (
            <dl className="facts">
              {block.facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd><Inline text={fact.value} /></dd>
                </div>
              ))}
            </dl>
          ) : null}
          {block.paragraphs?.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex}><Inline text={paragraph} /></p>
          ))}
          {block.items?.length ? (
            <ul className="list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><Inline text={item} /></li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  );
}

export function MarketingPage() {
  const { pathname } = useLocation();
  const page = pageByPath(pathname);
  if (!page || page.path.startsWith("/dokument/")) return <NotFound />;
  return <Article page={page} />;
}

export function Article({ page }: { page: PublicPage }) {
  return (
    <article className="prose">
      {page.kicker ? <p className="kicker">{page.kicker}</p> : null}
      <h1>{page.h1}</h1>
      {page.lead ? <p className="lead"><Inline text={page.lead} /></p> : null}
      <Blocks blocks={page.blocks} />
      {page.supplements?.length ? <Blocks blocks={page.supplements} /> : null}
      {page.cta || page.secondaryCta ? (
        <div className="row">
          {page.cta ? <Link className="btn" to={page.cta.to}>{page.cta.label}</Link> : null}
          {page.secondaryCta ? (
            page.secondaryCta.to.startsWith("/api/")
              ? <a className="btn-quiet" href={page.secondaryCta.to}>{page.secondaryCta.label}</a>
              : <Link className="btn-quiet" to={page.secondaryCta.to}>{page.secondaryCta.label}</Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function NotFound() {
  return (
    <article className="prose">
      <p className="kicker">404</p>
      <h1>Такой страницы нет</h1>
      <p className="lead">Проверьте адрес или вернитесь к списку бланков.</p>
      <div className="row">
        <Link className="btn" to="/">На главную</Link>
        <Link className="btn-quiet" to="/uslugi">Услуги</Link>
      </div>
    </article>
  );
}
