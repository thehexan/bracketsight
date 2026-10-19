import type { Metadata } from "next";

import { POLICY_UPDATED, pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where every route is measured against the others
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/terms-and-conditions");

/**
 * Terms and conditions — the agreement, and only the agreement.
 *
 * WHAT MOVED OUT: every sentence about how far a figure can be trusted, what
 * is unverified, what each tool is actually claiming and what the pre-launch
 * state means now lives on `/disclaimer`. Those are statements about the
 * numbers; these are statements about the relationship. A reader looking for
 * one was previously made to read past the other.
 *
 * STILL MISSING, AND ONLY THE OWNER CAN SUPPLY IT: a governing-law clause and
 * the legal identity of the operator. Both are deliberately absent rather than
 * guessed — naming a jurisdiction this site has no stated connection to, or
 * an entity that does not exist, would make this page worse than its silence.
 * See the `Maintainer` block in `src/lib/site.ts`, which is the same gap.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below.
 */
const UPDATED = POLICY_UPDATED;

export default function TermsAndConditionsPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "acceptance",
      heading: "What you are agreeing to",
      children: (
        <>
          <p>
            By using {SITE_NAME} you accept the terms on this page. They are short, and they are
            written to be read rather than clicked past. If you do not accept them, the remedy is
            simply not to use the tools — there is no account to close and nothing of yours to
            delete, because the site never held anything of yours in the first place.
          </p>
          <p>
            Nothing on this page limits a right you have under consumer law that cannot be
            limited by agreement. Where a sentence here and such a right disagree, the right wins
            and the rest of these terms continue to apply.
          </p>
        </>
      ),
    },
    {
      id: "permitted-use",
      heading: "What you may do with these tools",
      children: (
        <>
          <p>
            Use them for anything legitimate, including commercially: quote a job, plan a filing,
            advise a client, teach from the output, cite a figure in a piece of writing. There is
            no licence to buy, no seat limit, no attribution requirement and no signup. Verify the
            figures yourself first — the{" "}
            <Link href="/disclaimer">disclaimer</Link> sets out why that is not a formality.
          </p>
          <p>Two limits, and both exist to protect a reader rather than us:</p>
          <ul>
            <li>
              Do not represent the output as a professional opinion, an appraisal, or a
              determination by any agency. It is none of those, and presenting it as one transfers
              a confidence to your reader that the number has not earned.
            </li>
            <li>
              Do not republish a figure stripped of the conditions it was computed under. Every
              result here depends on inputs and on a dated rule; a number quoted without them is a
              different claim from the one the tool made.
            </li>
          </ul>
          <p>
            Beyond that: do not attempt to disrupt the site for other people, and do not use
            automated means to place load on it that a reader never would. Ordinary search-engine
            crawling is welcome and is permitted by the site&rsquo;s robots directives.
          </p>
        </>
      ),
    },
    {
      id: "documents-you-generate",
      heading: "Who owns a document the site generates",
      children: (
        <p>
          You do. A contract or invoice produced by the trades tool is yours, to use, edit, send
          and charge for, with no further permission from us and no obligation to say where it came
          from. The templates behind it are built from published statutory requirements, which
          belong to nobody. This does not make the document legally sufficient for your situation —
          have an attorney review a contract before you sign it.
        </p>
      ),
    },
    {
      id: "our-content",
      heading: "What belongs to this site",
      children: (
        <p>
          The written explanations, the page designs, the code of the engines and the structure of
          the rule files are ours. The rules themselves are not, and could not be: they are federal
          regulations, state statutes and county schedules, and every one carries a citation to the
          primary source so you can go and read it yourself rather than take our word for it.
          Quote what is useful, with a link. Wholesale reproduction of the written pages is not
          permitted; the figures those pages compute are facts, and facts are free.
        </p>
      ),
    },
    {
      id: "liability",
      heading: "Who is responsible if a number is wrong",
      children: (
        <>
          <p>
            You remain responsible for your own decisions. These tools are provided as-is, without
            warranty of any kind, and we accept no liability for loss arising from reliance on
            them. That is the honest position for a free tool computing high-stakes numbers from
            rules that change.
          </p>
          <p>
            It is also why corrections matter more to us than traffic. If you find a wrong figure,
            tell us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            and we will check it against the primary source and publish the change in that
            tool&rsquo;s changelog.
          </p>
        </>
      ),
    },
    {
      id: "availability",
      heading: "Availability, and changes to the tools",
      children: (
        <p>
          Nothing here is guaranteed to be available, and a tool can change when the rule beneath
          it changes — that is the point of the site rather than a defect in it. When a rule
          changes, the figure a tool gives for the same inputs changes with it, and the change is
          recorded with its date and source in that section&rsquo;s changelog. A result you saw
          last year was correct under last year&rsquo;s rules and may be wrong under this
          year&rsquo;s.
        </p>
      ),
    },
    {
      id: "third-party",
      heading: "Links and advertising",
      children: (
        <p>
          Pages here link to primary sources — federal regulations, agency guidance, state statutes
          and county schedules. Those sites are not ours and we do not control what they publish or
          how they treat your data. No advertising runs on this site today; what changes if it is
          switched on is set out in the{" "}
          <Link href="/cookie-policy">cookie policy</Link>, and the reasons an advertiser could
          never alter a computed figure are in the{" "}
          <Link href="/disclaimer">disclaimer</Link>.
        </p>
      ),
    },
    {
      id: "changes-to-terms",
      heading: "Changes to these terms",
      children: (
        <p>
          These terms carry the date they last changed, at the top of this page, and that date is
          bumped in the same edit as the wording rather than afterwards. There is no mailing list
          to notify, because there is no list — the date is the notification. Continuing to use the
          site after a change means accepting the version then published.
        </p>
      ),
    },
    {
      id: "contact",
      heading: "How to reach us about these terms",
      children: (
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . Questions about accuracy are better sent to the same address with the page and figure
          attached — see <Link href="/contact-us">contact</Link> for what makes a correction quick
          to act on.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Terms of use"
      title="Terms and Conditions"
      standfirst={
        <>
          The agreement between you and this site: what you may do with the tools, who owns what
          they produce, and where responsibility sits when a figure turns out to be wrong. What
          the figures <em>are</em>, and how far they can be trusted, is a separate question
          answered on the <Link href="/disclaimer">disclaimer</Link>.
        </>
      }
      updated={UPDATED}
      stamps={["No account, no signup", "Free to use commercially"]}
      sections={sections}
      footnote={
        <>
          See also the <Link href="/disclaimer">disclaimer</Link>, which explains what these
          estimates are and are not, and the{" "}
          <Link href="/privacy-policy">privacy policy</Link>, which explains why nothing you type
          leaves your browser.
        </>
      }
    />
  );
}
