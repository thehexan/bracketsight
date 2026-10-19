import type { Metadata } from "next";

import { POLICY_UPDATED, pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/site";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where every route is measured against the others
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/privacy-policy");

/**
 * Privacy policy — what is known about a reader, and what is not.
 *
 * WHAT MOVED OUT: the cookie inventory, the consent banner's behaviour, the
 * advertising identifiers and the opt-out routes are now on
 * `/cookie-policy`. This page answers "what do you know about me"; that one
 * answers "what are you putting on my machine, and how do I refuse". A
 * consent banner sends a reader looking for the second, and it now has a URL
 * of its own to send them to.
 *
 * Every disclosure kept below is the same sentence it was: the UK/EU
 * lawful-basis paragraph, the server-log paragraph and the uploaded-document
 * position are unchanged. Nothing was shortened in the split, and nothing
 * that was disclosed on one page stopped being disclosed.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below.
 */
const UPDATED = POLICY_UPDATED;

export default function PrivacyPolicyPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "what-you-type",
      heading: "What happens to what I type?",
      children: (
        <p>
          It stays on your own device. Each tool saves your work to your browser&rsquo;s{" "}
          <code>localStorage</code> so you can close the tab and come back, and it is stored under
          a key belonging to that tool. Clearing your browser&rsquo;s site data deletes it. Nobody
          else can read it, including us.
        </p>
      ),
    },
    {
      id: "shared-links",
      heading: "What about the link I can share?",
      children: (
        <p>
          Some tools let you share a scenario as a link. That scenario is encoded in the URL{" "}
          <em>fragment</em> — the part after the <code>#</code> — and browsers never transmit the
          fragment to a server. It is not in our access logs because it never reaches us. Anyone
          you send the link to can read those numbers, so treat the link itself as the private
          thing.
        </p>
      ),
    },
    {
      id: "collected",
      heading: "What do you collect at all?",
      children: (
        <p>
          Ordinary web server request logs — the page requested, a timestamp, a browser user-agent,
          and an IP address — which are what any web host records in order to serve a page. They
          contain none of your financial inputs. There is no account, no login, no database and no
          profile of you anywhere in this system, because nothing in it was built to have one.
        </p>
      ),
    },
    {
      id: "cookies",
      heading: "What about cookies and advertising?",
      children: (
        <p>
          The site sets no cookies of its own and runs no analytics that identify you. Advertising
          is not live today, and if it is switched on, an ad network still never receives what you
          type — the arithmetic happens in your browser and never leaves it, so there is nothing
          for an advertiser to be given. The full inventory of what is stored on your device, how
          the consent banner behaves, and every route by which you can refuse personalised
          advertising is set out in the{" "}
          <Link href="/cookie-policy">cookie policy</Link>.
        </p>
      ),
    },
    {
      id: "uk-eu",
      heading: "If you are in the UK or the EU",
      children: (
        <>
          <p>
            The lawful basis for the advertising storage described in the{" "}
            <Link href="/cookie-policy">cookie policy</Link> is your consent, given through the
            banner, and you may withdraw it at any time from the footer without giving a reason
            and without losing access to anything. The lawful basis for storing your work in a
            tool is that it is necessary to provide the calculator you asked to use.
          </p>
          <p>
            The site holds no account and no profile, so the rights of access, rectification,
            erasure and portability have very little to operate on. The only thing recorded
            server-side is the ordinary web request log described above, which contains an IP
            address and no financial input of any kind; everything else lives on your own device,
            and clearing your site data erases it. If you want to know what a log holds for a given
            date, or want it purged, write to the address below and say so.
          </p>
        </>
      ),
    },
    {
      id: "uploads",
      heading: "Will you ever process a document I upload?",
      children: (
        <p>
          Not today. A planned feature would read a statement or notice you upload to fill the form
          in for you. If it ships, the file will be processed in memory and never written to disk
          or object storage, its contents will never be logged, and the extracted figures will
          always be shown to you for confirmation before anything is calculated. That is a design
          constraint, not a preference.
        </p>
      ),
    },
    {
      id: "children",
      heading: "Is this site for children?",
      children: (
        <p>
          No. These are tools for adults making decisions about loans, tax, insurance subsidies,
          property assessments and building work, and they are not directed at children. Since the
          site holds no account and collects nothing that identifies anyone, it does not knowingly
          collect personal information from a child or from anybody else.
        </p>
      ),
    },
    {
      id: "contact",
      heading: "How do I ask a question or have something removed?",
      children: (
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Since we hold nothing that
          identifies you, there is generally nothing to remove — but if you think otherwise, say so
          and we will look.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Privacy policy"
      title="Privacy Policy"
      standfirst={
        <>
          Every calculator on this site runs entirely in your browser. The numbers you type —
          income, loan balances, assessed values, job costs — are never sent to a server, because
          there is no server to send them to. There is no account, no login and no database.
        </>
      }
      updated={UPDATED}
      stamps={["No account, no database", "Nothing you type is transmitted"]}
      sections={sections}
      footnote={
        <>
          See also the <Link href="/cookie-policy">cookie policy</Link> for what is stored on your
          device, and the <Link href="/disclaimer">disclaimer</Link> for what these estimates are
          and are not.
        </>
      }
    />
  );
}
