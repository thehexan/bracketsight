"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SECTION_PAGES, type SectionSlug } from "@/lib/site";

import styles from "./tool.module.css";

/**
 * SectionRail — one sub-nav, all five sections.
 *
 * Two of the five had no rail at all: `/aca` and `/property` shipped their
 * methodology, sources and changelog with nothing on the tool page pointing at
 * them, which is a click further from the evidence than `/loans` and a weaker
 * internal-linking floor than the publish gates ask for. The other three each
 * hand-wrote their own list, in their own order, at their own type size.
 *
 * The list is derived from `SECTION_PAGES`, so a rail entry cannot point at a
 * page that was never built and a new page cannot ship without appearing here.
 *
 * It is a recessed `--band` strip rather than a hairline-ruled row, which is
 * the third thing the tool pages were missing: breadcrumb on paper, rail on
 * band, masthead on paper, verdict on ink. Rhythm, from the first 130px.
 *
 * `min-height: 44px` on the link is the touch floor and does not move; the
 * height this band gives back comes out of the row's padding, not the target.
 */

export function SectionRail({ section, label }: { section: SectionSlug; label: string }) {
  const pathname = usePathname() ?? "";
  const root = `/${section}`;

  /*
   * TWO GROUPS, NOT EIGHT EQUAL ITEMS.
   *
   * Property's rail ran "The tool · Methodology · Sources · Editorial policy ·
   * Changelog · About · Check an assessment · Counties covered" at one weight,
   * which puts a thing you DO (check an assessment) below a record almost
   * nobody opens first (changelog), and asks a reader to tell them apart by
   * reading all eight.
   *
   * `SECTION_PAGES` already carries the distinction: `trust: false` is a page
   * that does something, `trust: true` is a page that backs a number up. The
   * rail now reads that flag rather than re-deciding it, so adding a page puts
   * it in the right group by construction.
   */
  const pages = SECTION_PAGES[section];

  const doing = [
    { href: root, label: "The tool" },
    ...pages
      .filter((page) => !page.trust)
      .map((page) => ({ href: `${root}${page.href}`, label: page.label })),
  ];

  const backing = pages
    .filter((page) => page.trust)
    .map((page) => ({ href: `${root}${page.href}`, label: page.label }));

  const link = (item: { href: string; label: string }, primary: boolean) => {
    const current = pathname === item.href;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={current ? "page" : undefined}
          className={
            `${styles.railLink}` +
            (primary ? ` ${styles.railLinkPrimary}` : "") +
            (current ? ` ${styles.railLinkCurrent}` : "")
          }
        >
          {item.label}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={label} className={`${styles.rail} surface-band`}>
      <ul className={`${styles.shell} ${styles.railList}`}>
        {doing.map((item) => link(item, true))}
        {backing.length > 0 ? (
          /* Decorative: the grouping is already conveyed by order and weight,
             and a screen reader reading "separator" between every rail would
             be noise rather than structure. */
          <li aria-hidden="true" className={styles.railDivider} />
        ) : null}
        {backing.map((item) => link(item, false))}
      </ul>
    </nav>
  );
}
