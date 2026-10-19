import type { Metadata } from "next";

import { POLICY_UPDATED, pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL, SECTIONS } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where every route is measured against the others
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/disclaimer");

/**
 * Disclaimer — what the figures on this site are, and what they are not.
 *
 * SPLIT OUT OF `/terms`, which until this edit carried both the agreement a
 * reader enters into and the accuracy limits of the numbers. Those answer
 * different questions and a reader arrives looking for one or the other, so
 * they are now two pages. Every sentence below is the wording it had on the
 * combined page; nothing was softened in the move, and the accuracy limits
 * did not become less prominent by getting their own URL — they became more
 * so, because this page is now linked by name from the footer of every page.
 *
 * `/terms-and-conditions` keeps the contract: permitted use, liability,
 * intellectual property. This page keeps the honesty.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below. A dated
 * disclaimer carrying a stale date is worse than an undated one.
 */
const UPDATED = POLICY_UPDATED;

export default function DisclaimerPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "how-much-to-trust",
      heading: "How much should I trust a number on this site?",
      children: (
        <p>
          Enough to ask a better question with it, not enough to act on alone. Every figure is
          computed by deterministic code from rule data that carries a citation and a verification
          date. No language model touches a calculation. But rules change, our reading of one can
          be wrong, and your own situation will contain facts the form never asked for. Confirm
          anything that matters with the body that actually decides it — your loan servicer, the
          marketplace, the county board, a licensed professional.
        </p>
      ),
    },
    {
      id: "not-advice",
      heading: "Is this financial, tax or legal advice?",
      children: (
        <>
          <p>
            No. Everything here is an estimate produced from published rules. It is not financial
            advice, not tax advice, not legal advice, and not an appraisal. Nobody here is your
            accountant, attorney, servicer or agent, and using these tools creates no professional
            relationship of any kind.
          </p>
          <p>
            The distinction matters more than it sounds. An adviser owes you a duty, knows your
            circumstances, and is accountable for the recommendation they give you. A calculator
            knows only the figures you typed into it and the rules it was built from. It cannot
            see the facts you did not enter, and it does not know which of your goals you would
            trade for which other one.
          </p>
        </>
      ),
    },
    {
      id: "verified",
      heading: "Are all the underlying figures verified?",
      children: (
        <p>
          No, and we publish exactly which ones are not. Each engine records what was checked
          against a primary source and what could not be. There are <strong className="num">55</strong> open items
          across the five engines today, grouped by what would unblock each; the summary is on the{" "}
          <Link href="/about-us">
            about page
          </Link>{" "}
          and the specifics are on each tool&rsquo;s sources and changelog pages. Where a figure
          could not be verified we say so on the page that shows it, rather than filling the gap
          with a plausible guess. In two places the tools refuse to answer at all rather than
          answer wrongly: contract generation is blocked in states whose statutory notice text has
          not been transcribed, and a New Jersey assessment verdict is withheld when the governing
          ratio is unavailable.
        </p>
      ),
    },
    {
      id: "finished",
      heading: "Is this a finished product?",
      children: (
        <p>
          Not yet, and the site says so where it matters. This is a pre-launch build: several rule
          values are placeholders awaiting verification against their primary sources, and no
          credentialed reviewer &mdash; an enrolled agent or CPA for the tax and subsidy engines, a
          construction attorney for the contract clause language, working contractors for the
          trades pricing data &mdash; has signed off on any section. Every page affected by that
          carries the warning. Treat the figures as illustrative of the method until it is lifted.
        </p>
      ),
    },
    {
      id: "what-each-tool-says",
      heading: "What is each tool actually telling me?",
      children: (
        <>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.slug}>
                <Link href={`/${s.slug}`}>
                  {s.name}
                </Link>{" "}
                — {s.tagline}
              </li>
            ))}
          </ul>
          <p>
            Estimates from the trades tool are estimates, never a binding quote: prices are
            reference data, not a live market feed, and a quote you send a customer is a number you
            have to honour. The documents it generates are templates, not legal advice — have an
            attorney review a contract before you sign it.
          </p>
        </>
      ),
    },
    {
      id: "independence",
      heading: "Does advertising affect what the tools tell me?",
      children: (
        <p>
          No, and it cannot. No advertising runs on the site today. If it is enabled, the ad
          network receives nothing you type &mdash; the arithmetic happens in your browser and
          never leaves it &mdash; and there is no code path by which an advertiser could change a
          computed figure, a ranking, a clause list or a recommendation. No lender, insurer,
          employer, servicer, marketplace or county pays for placement or mention anywhere here.
          The{" "}
          <Link href="/cookie-policy">
            cookie policy
          </Link>{" "}
          sets out the cookie and personalisation position in full.
        </p>
      ),
    },
    {
      id: "wrong-figure",
      heading: "What should I do if I find a figure that is wrong?",
      children: (
        <p>
          Tell us. Corrections matter more to us than traffic. Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>{" "}
          with the page and the figure, and we will check it against the primary source and publish
          the change in that tool&rsquo;s changelog. Where the error came from a rule we had
          recorded incorrectly, the rule file and its citation change too, which fixes every other
          page computed from it in the same edit.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Disclaimer"
      title="Disclaimer"
      standfirst={
        <>
          Everything here is an <strong>estimate produced from published rules</strong>. It is not
          financial advice, not tax advice, not legal advice, and not an appraisal. Nobody here is
          your accountant, attorney, servicer or agent, and using these tools creates no
          professional relationship.
        </>
      }
      updated={UPDATED}
      stamps={["Pre-launch build", "No credentialed sign-off yet"]}
      sections={sections}
      footnote={
        <>
          The{" "}
          <Link href="/terms-and-conditions">terms and conditions</Link> set out what you may do
          with these tools and where liability sits. The{" "}
          <Link href="/privacy-policy">privacy policy</Link> explains why nothing you type leaves
          your browser.
        </>
      }
    />
  );
}
