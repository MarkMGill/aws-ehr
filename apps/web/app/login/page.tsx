const errors: Record<string, string> = {
  signin: 'Sign-in could not be completed. Please try again. Check the app configuration if this continues.',
  unlinked: 'Your Cognito account is not linked to an EHR profile. Ask the administrator to link your account before signing in again.',
};

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Secure sign in</span>
        <h1>Access the EHR workspace</h1>
        <p>Sign in with your clinic account. You will continue to our secure sign-in page.</p>
        {searchParams.error ? <p className="error-text" role="alert">{errors[searchParams.error] ?? errors.signin}</p> : null}
        <a className="button primary full" href="/api/auth/login">Sign in with Cognito</a>
        <p>Account access is provided by your administrator.</p>
      </section>
    </main>
  );
}
