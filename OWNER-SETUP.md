# HEAM website: owner setup still required

The public pages and server endpoints are in the repository. Connect the services below in the **Vercel project’s Environment Variables** (Production and Preview) before announcing enquiry or newsletter sign-up as live.

## Contact, speaking and partnership forms

The `/api/enquiry` Vercel Function sends the contact, invitation and partnership forms through Resend. Configure:

- `RESEND_API_KEY` — a private Resend API key. Keep it in Vercel; never add it to website JavaScript or commit it to GitHub.
- `HEAM_CONTACT_EMAIL` — the owner-approved inbox that should receive enquiries.
- `HEAM_FROM_EMAIL` — a sender address on a domain verified in Resend.

If these are not configured, the forms explain that they are unavailable and link to the existing official Linktree contact page.

## Newsletter

The `/api/newsletter` Function adds consenting subscribers to a Resend audience. Configure:

- `RESEND_API_KEY` — the private API key above.
- `RESEND_AUDIENCE_ID` — the audience where newsletter subscriptions should be stored.

The signup form asks visitors to consent and explains that they can unsubscribe. Configure a real unsubscribe process before sending any newsletters.

## Administrator and content editing

The current public website is static; it does not yet include a secure `/admin` login. A repository-based CMS such as Decap CMS can manage articles, event records, books, media and page copy, but publishing it safely requires the owner to connect an authenticated CMS/OAuth service to the GitHub repository. Do not put a GitHub token, OAuth client secret or CMS service secret in public website files.

After the owner selects and connects a CMS/OAuth provider, the CMS needs collections for pages, articles, events, books/resources, media, testimonials, ministry details, platforms and contact/settings; photo uploads should go into the site’s image assets. Restrict CMS access to named administrators. Confirm backups and branch protection in GitHub.

## Owner-approved material still needed

- A fuller personal biography and approved vision/mission wording, if different from the supplied brief.
- The owner’s preferred contact email and public phone number.
- Confirmed book publication status, descriptions, audiences, covers and direct purchase URLs for each title.
- Approved articles and publication dates, video/podcast links, and any media appearance history.
- Event dates, venues, registration links and approved event photographs/highlights.
- Testimonial text, names/attributions and explicit approval to publish each one.
- Downloadable devotionals, study guides, annual reading plan, monthly themes and other free resource files.
- Final approval of the professional profile and downloadable press photographs.

## Vercel project settings

Use the repository root as the project root. The project is static HTML/CSS/JavaScript with Vercel Functions in `api/`. Keep the Build Command blank; `vercel.json` sets the static output to the root so `index.html` remains the deployment homepage even though `public/images/` exists.
