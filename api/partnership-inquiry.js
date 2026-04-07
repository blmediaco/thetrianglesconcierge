import { ensureDatabaseSchema, getDatabase } from '../lib/db.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeSingleLine(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeMultiline(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function getClientIp(request) {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return normalizeSingleLine(request.socket?.remoteAddress ?? '', 100);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.DATABASE_URL) {
    return response.status(500).json({
      error: 'Database is not configured yet. Add DATABASE_URL in Vercel project settings.',
    });
  }

  const payload = request.body ?? {};
  const contactName = normalizeSingleLine(payload.contactName, 120);
  const roleTitle = normalizeSingleLine(payload.roleTitle, 120);
  const companyName = normalizeSingleLine(payload.companyName, 160);
  const email = normalizeSingleLine(payload.email, 200).toLowerCase();
  const interest = normalizeSingleLine(payload.interest, 160);
  const communityDetails = normalizeMultiline(payload.communityDetails, 3000);
  const website = normalizeSingleLine(payload.website, 255);

  if (website) {
    return response.status(200).json({ ok: true });
  }

  if (!contactName || !roleTitle || !companyName || !email || !interest || !communityDetails) {
    return response.status(400).json({ error: 'Please complete every required field.' });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return response.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    await ensureDatabaseSchema();

    const sql = getDatabase();
    const result = await sql`
      INSERT INTO partnership_inquiries (
        contact_name,
        role_title,
        company_name,
        email,
        interest,
        community_details,
        ip_address,
        user_agent
      )
      VALUES (
        ${contactName},
        ${roleTitle},
        ${companyName},
        ${email},
        ${interest},
        ${communityDetails},
        ${getClientIp(request)},
        ${normalizeSingleLine(request.headers['user-agent'] ?? '', 500)}
      )
      RETURNING id, submitted_at;
    `;

    return response.status(201).json({
      ok: true,
      inquiryId: result[0]?.id ?? null,
      submittedAt: result[0]?.submitted_at ?? null,
    });
  } catch (error) {
    console.error('Failed to save partnership inquiry', error);
    return response.status(500).json({
      error: 'Something went wrong while saving your request. Please try again.',
    });
  }
}
