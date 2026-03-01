import { ArrowRightIcon } from '@phosphor-icons/react'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Build faster. Ship better.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto">
            Jasmine gives you the tools to create stunning, production-ready frontends in minutes — not weeks.
          </p>
          <div className="mt-10">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-100 text-zinc-950 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
              Get started
              <ArrowRightIcon weight="bold" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Zero-config setup</h3>
            <p className="mt-2 text-zinc-400">Clone, install, and run. No boilerplate headaches.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Responsive by default</h3>
            <p className="mt-2 text-zinc-400">Looks perfect on every screen size, out of the box.</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold">Accessible & fast</h3>
            <p className="mt-2 text-zinc-400">WCAG-compliant and Lighthouse 100 performance.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to build?</h2>
        <p className="mt-4 text-zinc-300 max-w-xl mx-auto">
          Join thousands of developers who ship faster with Jasmine.
        </p>
        <div className="mt-8">
          <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-100 text-zinc-950 font-semibold shadow-lg hover:scale-105 transition-transform duration-300">
            Start now
            <ArrowRightIcon weight="bold" className="w-5 h-5" />
          </button>
        </div>
      </section>
    </main>
  )
}