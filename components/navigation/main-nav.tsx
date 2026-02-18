import Link from 'next/link'
import { FiFeather, FiMic, FiList } from 'react-icons/fi'
import { cn } from '@/lib/utils'

type MainNavProps = {
  current: 'capture' | 'notes' | 'detail'
}

const navItems = [
  {
    href: '/',
    label: 'Capture',
    icon: FiMic,
    key: 'capture',
  },
  {
    href: '/notes',
    label: 'Notes',
    icon: FiList,
    key: 'notes',
  },
] as const

export function MainNav({ current }: MainNavProps) {
  return (
    <header className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <FiFeather className="h-4 w-4" />
          </span>
          <span className="font-serif text-2xl leading-none">Echo Notes</span>
        </Link>

        <nav className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white/80 p-1 shadow-sm backdrop-blur">
          {navItems.map((item) => {
            const isActive =
              item.key === current || (current === 'detail' && item.key === 'notes')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/75 hover:bg-accent'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
