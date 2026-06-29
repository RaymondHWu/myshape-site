import { NextResponse } from "next/server";

/**
 * GET /api/matrix/auth/linkedin
 *
 * Initiates LinkedIn OAuth2 Authorization Code flow.
 * Redirects to LinkedIn's consent page.
 *
 * Required env vars: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
 * Callback: /api/matrix/auth/linkedin/callback
 */

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "LINKEDIN_CLIENT_ID not configured in .env.local" },
      { status: 500 },
    );
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const redirectUri = `${baseUrl}/api/matrix/auth/linkedin/callback`;
  const scope = "openid profile w_member_social email";

  // Use a random state param for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  return NextResponse.redirect(authUrl);
}
