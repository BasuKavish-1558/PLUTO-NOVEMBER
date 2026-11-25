/** Turns Supabase Auth errors into plain sentences. */
export function authErrorMessage(e: unknown): string {
  if (!navigator.onLine) return "You're offline. Connect to the internet and try again."
  const code = (e as { code?: string })?.code
  const message = e instanceof Error ? e.message : ''
  switch (code) {
    case 'invalid_credentials':
      return 'Wrong email or password.'
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Sign in instead.'
    case 'email_not_confirmed':
      return 'Confirm your email first. Check your inbox for the link.'
    case 'wrong_current_password':
      return 'Your current password is wrong.'
    case 'same_password':
      return 'Choose a password different from your current one.'
    case 'otp_expired':
      return 'This link has expired. Request a new one.'
    case 'weak_password':
      return 'Choose a stronger password: at least 8 characters.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Wait a minute and try again.'
  }
  if (/fetch|network/i.test(message)) return "Couldn't reach the server. Check your connection."
  return message || 'Something went wrong. Try again.'
}
