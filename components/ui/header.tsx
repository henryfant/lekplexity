'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, Sparkles, Search } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Regular Search', href: '/', icon: Search },
    { name: 'Sector Search', href: '/deep-search', icon: Sparkles },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-zinc-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg opacity-0 group-hover:opacity-75 blur transition duration-300" />
                <Image
                  src="/your-logo.png"
                  alt="Your Logo"
                  width={113}
                  height={24}
                  className="relative w-[113px] h-auto"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-green-500 to-emerald-500" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 scale-x-0 transition-transform duration-300 hover:scale-x-100" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2"
            >
              <div className="relative">
                <Menu className={`h-5 w-5 transition-all duration-300 ${mobileMenuOpen ? 'rotate-90 opacity-0' : ''}`} />
                <X className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`} />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-48' : 'max-h-0'} overflow-hidden`}>
          <nav className="pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
} 