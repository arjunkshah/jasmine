export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-400">© 2024 Jasmine. All rights reserved.</p>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <a href="/terms" className="hover:text-zinc-100 transition">Terms</a>
          <a href="/privacy" className="hover:text-zinc-100 transition">Privacy</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100 transition">Twitter</a>
        </div>
      </div>
    </footer>
  )
}