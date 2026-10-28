import type { Metadata } from "next";

import { POLICY_UPDATED, pageMetadata } from "@/lib/seo";
import Link from "next/link";

import { PolicyPage, type PolicySection } from "@/components/layout/PolicyPage";
import { CONTACT_EMAIL } from "@/lib/site";
// The disclosure below must describe the VERIFICATION tag that layout.tsx
// renders, not the ad-unit client. They are deliberately separate variables
// so that verifying ownership cannot silently start serving ads — reading the
// wrong one here would make this page assert the opposite of what ships.
import { ADSENSE_VERIFICATION_CLIENT as ADSENSE_CLIENT } from "@/lib/ads/config";

/*
 * Title, description and canonical come from the route registry in
 * `src/lib/seo/routes.ts`, where every route is measured against the others
 * for length and uniqueness at build time. A page does not write its own.
 */
export const metadata: Metadata = pageMetadata("/cookie-policy");

/**
 * Cookie policy — storage, the consent banner, and advertising identifiers.
 *
 * SPLIT OUT OF `/privacy`, which carried both. The two questions a reader
 * actually arrives with are "what do you know about me" and "what are you
 * storing on my machine, and how do I say no", and the second one is the one
 * a consent banner sends them looking for. It now has a URL of its own that
 * the banner itself can point at.
 *
 * THE CONDITIONAL BELOW IS LOAD-BEARING. `ADSENSE_CLIENT` is the verification
 * tag's publisher ID. When it is set, Google's script is in the document head
 * and CAN set cookies even though no ad unit renders anywhere; when it is not,
 * no ad network script is loaded at all. The page must state whichever of
 * those is true of the build the reader is looking at, because a reader can
 * check it in one view-source and a reviewer certainly will.
 *
 * BUMP `UPDATED` IN THE SAME EDIT that changes any wording below, and rewrite
 * the advertising paragraphs on the day advertising actually goes live: they
 * are in the future tense because that is currently true, and leaving them in
 * the future tense once ads are serving would be a false statement about
 * personal data.
 */
const UPDATED = POLICY_UPDATED;

export default function CookiePolicyPage() {
  const sections: readonly PolicySection[] = [
    {
      id: "cookies",
      heading: "Do you use cookies?",
      children: (
        <>
          <p>
            No cookies of our own, and no analytics that identify you.
          </p>
          <p>
            <strong>No advertising runs on this site today.</strong> There is no ad unit on any
            page, so nothing is being sold or displayed.
          </p>
          {ADSENSE_CLIENT ? (
            <p>
              Google&rsquo;s AdSense script <em>is</em> loaded in the head of this page, because
              Google requires it to verify that we own this domain and to review the site. It can
              set cookies in your browser even though no ad is shown to you. You can confirm it by
              viewing the source and searching for <code>googlesyndication</code>.
            </p>
          ) : (
            <p>
              No ad network&rsquo;s script is loaded on any page of this build. You can confirm
              that by viewing the source and searching it for <code>googlesyndication</code>:
              nothing will be found.
            </p>
          )}
          <p>
            If and when advertising is approved and switched on, this page will name what changes
            before it changes, and the cookie banner will continue to govern personalised
            advertising. Nothing you type into a calculator is sent to Google, or to anyone —
            that is a property of how the tools are built, not a promise about advertising.
          </p>
        </>
      ),
    },
    {
      id: "what-is-stored",
      heading: "What is stored on my device?",
      children: (
        <>
          <p>
            What the site does store, it stores on your own device, and there are only two things:
          </p>
          <ul>
            <li>
              <strong>Your work in a tool.</strong> Written to <code>localStorage</code> under a key
              belonging to that tool, so you can close the tab and come back. It is your own input,
              it is read by nothing except the tool that wrote it, and it is never transmitted.
              This is storage you asked for by using the calculator, so it is not gated behind a
              consent prompt — gating it would break the tool for the sake of a banner.
            </li>
            <li>
              <strong>Your cookie choice.</strong> One entry recording whether you accepted or
              refused advertising cookies, and when. Storing a refusal is the only way to stop
              asking you.
            </li>
          </ul>
          <p>
            Clearing your browser&rsquo;s site data deletes both. Neither reaches a server, because
            there is no server to reach.
          </p>
        </>
      ),
    },
    {
      id: "consent-banner",
      heading: "How the consent banner works",
      children: (
        <>
          <p>
            On a first visit a banner appears at the foot of the page with two choices,{" "}
            <strong>Reject</strong> and <strong>Accept</strong>, in that order, the same size and
            the same weight. Nothing is pre-selected and nothing is hidden behind a &ldquo;manage
            preferences&rdquo; screen. Every page, every tool and every figure on this site works
            identically whichever you choose, because no content here depends on advertising.
          </p>
          <p>
            Until you accept, advertising storage is refused: that is the default, and closing the
            banner with the Escape key or ignoring it leaves the refusal in place. Silence is not
            consent. The banner is served from this site — there is no consent-management vendor,
            no third-party script and no request to anyone else in order to ask you the question.
          </p>
          <p>
            You can change or withdraw the choice at any time from the{" "}
            <strong>Cookie choices</strong> control in the footer of every page, which also shows
            what you currently have set. Withdrawing takes the same single click as giving.
          </p>
        </>
      ),
    },
    {
      id: "advertising",
      heading: "What happens when advertising is enabled?",
      children: (
        <>
          <p>
            The intended provider is Google AdSense, under publisher account{" "}
            <code>pub-9291183762432851</code>. When it is switched on, Google and its partners will
            serve ads here and, like any ad network, will use cookies and similar identifiers to do
            it. This page will be rewritten to say that advertising is live on the day it goes
            live, rather than describing it in the future tense as it does now.
          </p>
          <p>
            Third-party vendors, Google included, use cookies to serve ads based on a user&rsquo;s
            prior visits to this and other websites. Google&rsquo;s use of advertising cookies
            enables it and its partners to serve ads to you based on your visit to this site and
            other sites on the internet. How Google uses the information it collects from sites
            that use its services is set out at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">
              policies.google.com/technologies/partner-sites
            </a>
            , and its advertising practices at{" "}
            <a href="https://policies.google.com/technologies/ads" rel="noopener">
              policies.google.com/technologies/ads
            </a>
            .
          </p>
          <p>
            One thing will not change: an ad network never receives what you type into a tool. Your
            income, balances, assessed values and job costs are computed in your own browser and
            are never sent anywhere, so there is nothing for an advertiser to be given. No result,
            ranking or recommendation changes because of an advertiser, and no ad can be placed
            inside a calculator — the component that reserves ad space refuses to render inside a
            tool panel and throws in development if anyone tries.
          </p>
        </>
      ),
    },
    {
      id: "opting-out",
      heading: "How do I refuse personalised advertising?",
      children: (
        <>
          <p>
            Through the banner, or the <strong>Cookie choices</strong> control in the footer, which
            governs what this site does. For the wider settings that follow you between sites:
          </p>
          <ul>
            <li>
              Google&rsquo;s own personalisation switch is at{" "}
              <a href="https://www.google.com/settings/ads" rel="noopener">
                google.com/settings/ads
              </a>
              .
            </li>
            <li>
              A third-party vendor&rsquo;s use of cookies for personalised advertising can be
              refused at{" "}
              <a href="https://www.aboutads.info/choices/" rel="noopener">
                aboutads.info/choices
              </a>{" "}
              or, in Europe, at{" "}
              <a href="https://www.youronlinechoices.eu/" rel="noopener">
                youronlinechoices.eu
              </a>
              .
            </li>
            <li>
              Your browser&rsquo;s own settings can block or clear cookies for this site and every
              other one. Nothing here depends on a cookie, so blocking them costs you no
              functionality.
            </li>
          </ul>
          <p>
            Refusing personalisation does not remove the ads; it means they are chosen from the
            content of the page and your approximate location rather than from a profile of you.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      heading: "How do I ask a question about this?",
      children: (
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. The{" "}
          <Link href="/privacy-policy">privacy policy</Link> covers what is collected at all, the
          lawful basis for it in the UK and the EU, and what a server log holds.
        </p>
      ),
    },
  ];

  return (
    <PolicyPage
      eyebrow="Cookie policy"
      title="Cookie Policy"
      standfirst={
        <>
          This site sets <strong>no cookies of its own</strong> and runs no analytics that identify
          you. Two things are stored on your device — your work in a tool, and your answer to the
          cookie banner — and both are deleted when you clear your site data.
        </>
      }
      updated={UPDATED}
      stamps={["No advertising live today", "No consent vendor, no third-party script"]}
      sections={sections}
      footnote={
        <>
          See also the <Link href="/privacy-policy">privacy policy</Link>, which explains why
          nothing you type into a calculator ever leaves your browser.
        </>
      }
    />
  );
}
