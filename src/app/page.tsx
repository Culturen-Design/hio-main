import Link from "next/link";

const CATEGORIES = [
  { icon: "✂️", label: "Salon & Beauty" },
  { icon: "🍕", label: "Restaurant" },
  { icon: "🔧", label: "Plumber" },
  { icon: "🍞", label: "Bakery" },
  { icon: "💪", label: "Gym & Fitness" },
  { icon: "🏠", label: "Cleaning" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us about your business",
    description: "Your name, category, and a short description. Takes under a minute.",
  },
  {
    step: "02",
    title: "Pick your visual identity",
    description: "Choose a color, upload your logo, pick a font style. We handle the rest.",
  },
  {
    step: "03",
    title: "AI builds your site",
    description: "Our AI writes your copy, selects images, and assembles a polished landing page.",
  },
  {
    step: "04",
    title: "Chat to edit anything",
    description: "\"Add a pedicure for €25\" — just type it. The AI updates your live site instantly.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight">hio.space</span>
          <div className="flex items-center gap-6">
            <Link href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              How it works
            </Link>
            <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700 mb-8">
            <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
            AI-powered · No coding required · Live in 60 seconds
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-zinc-900 mb-6 leading-[1.05]">
            Your business website,{" "}
            <span className="text-indigo-600">built by AI</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Answer four questions. Watch AI write your copy, pick your images, and publish a real website — then chat with it to make any change, forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="rounded-full bg-zinc-900 px-8 py-4 text-base font-semibold text-white hover:bg-zinc-700 transition-colors shadow-lg shadow-zinc-900/10"
            >
              Build my website — it&apos;s free
            </Link>
            <button className="rounded-full border border-zinc-200 bg-white px-8 py-4 text-base font-medium text-zinc-700 hover:border-zinc-300 transition-colors">
              See a demo ↗
            </button>
          </div>
          <p className="mt-4 text-sm text-zinc-400">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* Business categories */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-sm font-medium text-zinc-400 uppercase tracking-widest mb-8">
            Works for every local business
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {CATEGORIES.map(({ icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 hover:border-zinc-200 transition-colors"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-zinc-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              From zero to published in 4 steps
            </h2>
            <p className="text-lg text-zinc-500">
              No design skills. No developers. No monthly agency fees.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="rounded-2xl bg-white border border-zinc-100 p-8 shadow-sm">
                <span className="text-xs font-mono font-semibold text-indigo-500 tracking-widest">{step}</span>
                <h3 className="mt-3 text-xl font-semibold text-zinc-900 mb-2">{title}</h3>
                <p className="text-zinc-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI chat demo callout */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-zinc-900 p-10 sm:p-16 text-center">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
              Edit with plain language
            </h2>
            <p className="text-zinc-400 text-lg mb-10">
              No menus to dig through. Just tell the AI what you want.
            </p>
            <div className="space-y-3 text-left max-w-lg mx-auto">
              {[
                `"Add a new Pedicure service, 1.5 hours, €25"`,
                `"Change my primary colour to blush pink"`,
                `"Update my opening hours to close at 7pm on weekdays"`,
                `"Remove the team section from my homepage"`,
              ].map((msg) => (
                <div key={msg} className="rounded-2xl bg-zinc-800 border border-zinc-700 px-5 py-3.5 text-sm text-zinc-300 font-mono">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">
            Ready to go live?
          </h2>
          <p className="text-lg text-zinc-500 mb-10">
            Your website is waiting. It takes less time than making a coffee.
          </p>
          <Link
            href="/onboarding"
            className="inline-block rounded-full bg-indigo-600 px-10 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-500/25"
          >
            Build my website — free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-zinc-900">hio.space</span>
          <p className="text-sm text-zinc-400">© 2026 hio.space. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
