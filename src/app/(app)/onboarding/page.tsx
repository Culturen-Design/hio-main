export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">
          Let&apos;s build your website
        </h1>
        <p className="text-zinc-500 mb-8">
          The onboarding wizard will live here — multi-step form with brand setup, logo upload, and AI generation.
        </p>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-zinc-400 text-sm">
          Onboarding wizard — coming in the next phase
        </div>
      </div>
    </div>
  );
}
