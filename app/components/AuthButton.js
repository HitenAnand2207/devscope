"use client";

export default function AuthButton() {
  const handleSignIn = () => {
    // Redirect to login route that initiates the GitHub OAuth flow
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleSignIn}
        className="px-3 py-1 rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
