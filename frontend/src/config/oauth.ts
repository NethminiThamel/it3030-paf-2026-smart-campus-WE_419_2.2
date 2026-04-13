/**
 * Google OAuth Web Client ID (public). Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.
 * Email/password works without this.
 */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''

export function isGoogleClientConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0 && GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')
}
