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

The website includes a Decap CMS editor at `/admin/`. The owner must connect it to an authenticated Decap Turbo site before anyone can sign in. Keep the CMS site ID in the configuration, and never put a GitHub token, OAuth client secret or other private service secret in public website files.

1. Create a Decap Turbo site and connect the GitHub repository `wonderit24/healingsazuikeministry` on the `main` branch.
2. In Decap Turbo, allow the production admin URL `https://healingsazuikeministry.vercel.app/admin/` and assign access only to named editors.
3. Copy the Turbo site ID from the site overview into `backend.turbo_site_id` in `admin/config.yml`, replacing `SET_AFTER_OWNER_SETUP`, then commit and push that change.
4. Open `/admin/` on the deployed site and sign in through the authorised provider. The editor manages site copy, additional pages, books and resources, articles, events, media, testimonials, ministries and platforms.
5. Editors can save drafts and publish through the editorial workflow. Uploaded images are stored in `public/images/uploads/`; GitHub commits trigger Vercel deployments.

The owner must complete this account connection; the repository does not contain the owner�s Decap Turbo site ID or login approval. Keep GitHub backups enabled and review edits before publishing.
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
