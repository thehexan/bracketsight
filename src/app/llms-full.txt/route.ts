import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";

import { type FigureId, figureText, listFigureIds, listPosts } from "@/lib/content";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/*
 * `figureText` takes the FigureId union, not a string, which is deliberate:
 * a typo in an article's figure id is meant to be a compile error. Ids pulled
 * out of MDX with a regex are strings, so they are checked against the real
 * set before use rather than cast past the type. An id that is not in the set
 * resolves to nothing here; the build's own figure checks are what fail the
 * build over it, and this route must not be the thing that decides that.
 */
const VALID_FIGURE_IDS: ReadonlySet<string> = new Set<string>(listFigureIds());

function figureTextSafe(id: string): string {
  if (!VALID_FIGURE_IDS.has(id)) return "";
  return figureText(id as FigureId);
}

/*
 * /llms-full.txt — the full written corpus in one plain-text file.
 *
 * WHY. `public/llms.txt` is the index: what this site is and which sections
 * exist. This is the payload: every article's actual text, with every figure
 * resolved to the number the engine computes and every source listed with the
 * date it was last read. An answer engine that fetches one URL gets the whole
 * corpus, already attributed, instead of crawling and guessing.
 *
 * WHY IT IS GENERATED AND llms.txt IS NOT. `public/llms.txt` is hand-written
 * and dated 18 August 2026. It still reports the gap count it had then and
 * knows nothing about anything published since, which is what a static copy of
 * a moving fact always does. This file is built from `content/posts` and the
 * rule files at build time, so it cannot drift: publish an article and it is
 * here, change a rule and the number here changes with it.
 *
 * FIGURES ARE RESOLVED, NOT STRIPPED. `<KeyFigure id="aca.cliff.ceilingMultiple" />`
 * becomes the sentence the engine produces. A corpus that says "KeyFigure" at
 * every number would be worse than no corpus, because it reads as though the
 * site has no numbers in it.
 */

export const dynamic = "force-static";

const POSTS_DIR = "content/posts";

/** `<KeyFigure id="x" ... />` → the engine's own wording for that figure. */
function resolveFigures(body: string): string {
  return body.replace(
    /<KeyFigure\s+id=["']([^"']+)["'][^>]*\/>/g,
    (_match, id: string) => figureTextSafe(id),
  );
}

/** Flatten the article components into prose an answer engine can read. */
function flatten(body: string): string {
  let out = body;

  /* The MDX import line is machinery, not content. */
  out = out.replace(/^import\s.+$/gm, "");

  out = resolveFigures(out);

  /* FAQ items carry real question/answer pairs — the most quotable part of a
     page — so they are unwrapped rather than dropped. */
  out = out.replace(/<FAQ[\s\S]*?items=\{\[([\s\S]*?)\]\}\s*\/>/g, (_m, items: string) => {
    const pairs: string[] = [];
    const re = /question:\s*"([^"]+)"[\s\S]*?answer:\s*(?:`([\s\S]*?)`|"([^"]*)")/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(items)) !== null) {
      const question = m[1];
      const answer = (m[2] ?? m[3] ?? "")
        .replace(/\$\{figureText\(["']([^"']+)["']\)\}/g, (_x, id: string) =>
          figureTextSafe(id),
        )
        .replace(/\s+/g, " ")
        .trim();
      pairs.push(`**${question}**\n\n${answer}`);
    }
    return pairs.length ? `### Questions\n\n${pairs.join("\n\n")}` : "";
  });

  /* A call to action is a button on a page and noise in a corpus. */
  out = out.replace(/<ToolCTA[\s\S]*?<\/ToolCTA>/g, "");
  out = out.replace(/<ToolCTA[\s\S]*?\/>/g, "");

  /* Tables and the rest of the JSX: keep the words, drop the tags. */
  out = out.replace(/<FigureTable\s+id=["']([^"']+)["'][^>]*\/>/g, "");
  out = out.replace(/<\/?[A-Za-z][^>]*>/g, " ");

  /* Entities that survive the tag strip. */
  out = out
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/\{"\s*"\}/g, " ");

  return out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

export function GET(): Response {
  const posts = listPosts();
  const dir = join(process.cwd(), POSTS_DIR);
  const files = new Set(readdirSync(dir).filter((f) => f.endsWith(".mdx")));

  const parts: string[] = [];

  parts.push(`# ${SITE_NAME} — full text corpus`);
  parts.push(
    `> Every written guide on ${SITE_URL}, in full, with each figure resolved to the\n` +
      `> value the engine computes from its cited rule file. Generated at build time\n` +
      `> from the same sources the pages render, so it cannot disagree with them.\n` +
      `>\n` +
      `> Attribution: ${SITE_NAME} (${SITE_URL}). Each guide lists its own primary\n` +
      `> sources with the date each was last verified. Quote the source, not this file,\n` +
      `> for anything a reader will act on.`,
  );
  parts.push(
    `## Standing facts about these numbers\n\n` +
      `- No language model computes, estimates or adjusts any figure on this site. All\n` +
      `  arithmetic is deterministic and runs in the reader's browser.\n` +
      `- Rates, brackets, thresholds and terms live in versioned JSON with primary-source\n` +
      `  citations and a last-verified date. A figure carries the rule set it came from.\n` +
      `- Money is integer cents and rates are integer basis points. No floating-point currency.\n` +
      `- Figures that could not be verified against a primary source are disclosed at the\n` +
      `  point of use rather than presented as settled.`,
  );

  for (const post of posts) {
    const file = `${post.slug}.mdx`;
    if (!files.has(file)) continue;

    const raw = readFileSync(join(dir, file), "utf8");
    const { content } = matter(raw);

    const sources = (post.sources ?? [])
      .map((s) => `- ${s.label} — ${s.url} (last verified ${s.lastVerified})`)
      .join("\n");

    parts.push(
      [
        `---`,
        ``,
        `# ${post.title}`,
        ``,
        `URL: ${absoluteUrl(post.href)}`,
        `Tool: ${post.tool}`,
        `Published: ${post.publishedAt} · Last reviewed: ${post.updatedAt}`,
        `Author: ${post.author}` +
          (post.reviewedBy === "UNREVIEWED"
            ? " · No named reviewer has checked this page."
            : ` · Reviewed by ${post.reviewedBy}`),
        ``,
        `${post.description}`,
        ``,
        flatten(content),
        ``,
        sources ? `## Sources\n\n${sources}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  return new Response(`${parts.join("\n\n")}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
