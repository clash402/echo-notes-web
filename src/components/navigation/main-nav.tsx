'use client'

import Link from 'next/link'
import {
  BookOpenText,
  ChevronDown,
  DatabaseZap,
  Feather,
  Mic,
  Orbit,
  Waypoints,
} from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

type MainNavProps = {
  current: 'capture' | 'notes' | 'detail'
}

const navItems = [
  { href: '/', label: 'Capture', icon: Mic, key: 'capture' },
  { href: '/notes', label: 'Notes', icon: BookOpenText, key: 'notes' },
] as const

const products = [
  { name: 'Taskflow', role: 'Orchestration', icon: Waypoints },
  { name: 'Data Ghost', role: 'Decision intelligence', icon: DatabaseZap },
  { name: 'Echo Notes', role: 'Knowledge and memory', icon: Feather, current: true },
]

export function MainNav({ current }: MainNavProps) {
  const productMenuRef = useRef<HTMLDetailsElement>(null)

  const closeProductMenu = () => productMenuRef.current?.removeAttribute('open')

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) closeProductMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProductMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-[hsl(var(--ghost-surface)/0.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-ghost-ink text-white">
              <Orbit aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <span className="hidden sm:inline">Ghost Platform</span>
          </Link>
          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <details ref={productMenuRef} className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Feather aria-hidden="true" className="h-4 w-4 text-primary" />
              Echo Notes
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-11 w-64 rounded-xl border bg-popover p-2 shadow-lg">
              {products.map((product) => (
                <button
                  type="button"
                  key={product.name}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted',
                    product.current && 'bg-accent'
                  )}
                  onClick={closeProductMenu}
                >
                  <product.icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{product.name}</span>
                    <span className="block text-xs text-muted-foreground">{product.role}</span>
                  </span>
                  {product.current ? <span className="text-xs text-primary">Current</span> : null}
                </button>
              ))}
            </div>
          </details>
        </div>

        <nav className="inline-flex items-center gap-1 rounded-lg bg-secondary p-1">
          {navItems.map((item) => {
            const isActive =
              item.key === current || (current === 'detail' && item.key === 'notes')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground'
                )}
              >
                <item.icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
