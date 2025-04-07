'use client'

import { faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import Link from 'next/link'
import { ThemePicker } from '@/components/layout/ThemePicker'
import { Button } from '@/components/ui/button'

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-background/60 border-b-foreground/6 sticky top-0 z-40 flex w-full flex-row items-center justify-between border-b border-solid px-4 py-3 backdrop-blur-xl duration-300">
      <div className="flex flex-row items-center gap-x-2 md:gap-x-6">
        <Button
          variant="outline"
          className="hover:text-accent h-9 w-9 cursor-pointer rounded-md duration-300 lg:hidden"
          aria-label="Toggle Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FontAwesomeIcon icon={faBars} className="fa-fw" />
        </Button>
        <Link href="/" className="text-primary text-xl font-bold">
          Bot de Puré
        </Link>
        <nav>
          <ul className="animate-colors hidden items-center space-y-0 space-x-4 md:flex">
            <li>
              <Link
                href="/commands"
                className="text-foreground hover:text-primary duration-200"
              >
                Comandos
              </Link>
            </li>
            <li>
              <Link
                href="/modules"
                className="text-foreground hover:text-primary duration-200"
              >
                Módulos
              </Link>
            </li>
            <li>
              <Link
                href="/learn"
                className="text-foreground hover:text-primary duration-200"
              >
                Guías
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <nav>
        <ul className="animate-colors items-center space-y-2 md:flex md:space-y-0 md:space-x-4">
          <li>
            <ThemePicker />
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default NavBar
