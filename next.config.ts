import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The five engines are workspace source packages, not built artefacts.
  transpilePackages: [
    "@/engines/repayment",
    "@/engines/paycheck",
    "@/engines/aca",
    "@/engines/property",
    "@/engines/trades",
    "@/components/ui",
  ],

  /*
   * The guide and glossary routes read three things off disk at build time:
   * the article bodies and frontmatter in `content/posts`, and `KNOWN-GAPS.md`,
   * which is the register a <KeyFigure> quotes when the figure it prints sits
   * on an unresolved verification item. Every one of those routes is fully
   * prerendered, so the reads happen during `next build` and never in a
   * request — but tracing the files keeps a standalone server honest if a
   * route is ever made dynamic. Cheap insurance against a silent empty page.
   */
  /*
   * THE LEGAL PAGES MOVED, AND THE OLD URLS MUST NOT 404.
   *
   * `/privacy` carried both the data notice and the cookie inventory, and
   * `/terms` carried both the agreement and the accuracy disclaimer. Each is
   * now two pages, because a reader arrives looking for one or the other and
   * a consent banner sends them looking specifically for the cookie half.
   *
   * 308, not 307: these moves are permanent, and a permanent redirect is what
   * passes the old URL's standing to the new one. A 307 asks a crawler to
   * keep the old URL indexed, which is the opposite of what a rename wants.
   *
   * The split pages each redirect to the half that kept the page's primary
   * job — the agreement for `/terms`, the data notice for `/privacy` — and
   * both of those link to their other half in body copy, so a reader who
   * wanted the cookie inventory is one labelled click away rather than lost.
   *
   * DO NOT DELETE THESE once traffic looks settled. Links on other people's
   * sites do not expire, and these cost nothing to keep.
   */
  async redirects() {
    return [
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/contact", destination: "/contact-us", permanent: true },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      { source: "/terms", destination: "/terms-and-conditions", permanent: true },
      /* Anchors people may have pasted at each other, pointed at the page
         that now holds that section rather than at the page that lost it. */
      { source: "/privacy/cookies", destination: "/cookie-policy", permanent: true },
      { source: "/terms/disclaimer", destination: "/disclaimer", permanent: true },
    ];
  },

  outputFileTracingIncludes: {
    "/guides": ["./content/**/*"],
    "/guides/[slug]": ["./content/**/*", "./KNOWN-GAPS.md"],
    "/glossary": ["./KNOWN-GAPS.md"],
  },
};

/*
 * MDX, kept to the smallest configuration that works.
 *
 * `remark-frontmatter` is the whole reason a plugin list exists here: without
 * it, the YAML block at the top of every article compiles into visible prose
 * (`---` becomes a horizontal rule and the keys become a paragraph). It parses
 * the block out of the document and emits nothing — the metadata itself is
 * read separately, by `gray-matter`, in `src/lib/content/posts.ts`, so the
 * compiler and the loader agree by construction rather than by convention.
 *
 * The plugin is named as a STRING, not imported and passed as a function.
 * Turbopack serialises loader options, so a function value cannot cross that
 * boundary; `@next/mdx` resolves the string from the project root for both the
 * Turbopack and webpack paths.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter"],

    /*
     * No MDX provider. `@next/mdx` defaults `providerImportSource` to a module
     * alias that falls back to `@mdx-js/react`, which calls
     * `React.createContext` at module scope — and a React Server Component
     * cannot create context, so every article fails to prerender with
     * "createContext is not a function".
     *
     * Setting it to null compiles articles without any provider lookup. The
     * element mapping arrives as the `components` prop instead, from
     * `src/components/content/mdx-components.tsx`, which is where it was
     * always meant to come from: one file lists everything an article can use,
     * the whole article tree stays server-rendered, and no article inherits a
     * component from a context it cannot see.
     */
    providerImportSource: null,
  },
});

export default withMDX(nextConfig);
