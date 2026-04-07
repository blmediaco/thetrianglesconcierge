# thetrianglesconcierge

Static marketing site for The Triangle's Concierge with Vercel serverless endpoints for client interest and partnership inquiries.

## Database setup

1. Create a Postgres database for the Vercel project.
2. Add `DATABASE_URL` to the `thetrianglesconcierge` Vercel project.
3. Deploy.

The first successful form submission will auto-create the `partnership_inquiries` and `client_interest_inquiries` tables. The SQL definitions are also included in `db/schema.sql`.
