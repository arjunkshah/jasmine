import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-zinc-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-zinc-100 font-semibold tracking-tight">
          Jasmine
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
          <a href="#features" className="hover:text-zinc-100 transition">Features</a>
          <a href="#pricing" className="hover:text-zinc-100 transition">Pricing</a>
          <a href="#contact" className="hover:text-zinc-100 transition">Contact</a>
        </nav>
      </div>
    </header>
  )
}