export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-100 p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Create your account</h1>
        <p className="text-zinc-500 text-sm mb-8">Start building your website for free</p>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
