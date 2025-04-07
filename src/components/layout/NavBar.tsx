'use client'

import { faBars, faPalette } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import { useTheme } from './PageContent'
import Link from 'next/link'

const NavBar = () => {
  const { rotateTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-background/60 border-b-foreground/6 sticky top-0 z-40 flex w-full flex-row items-center justify-between border-b border-solid px-4 py-3 backdrop-blur-xl duration-300">
      <div className="flex flex-row items-center gap-x-2 md:gap-x-6">
        <button
          className="text-primary border-foreground/8 bg-foreground/2 hover:bg-foreground/5 block h-8 w-8 cursor-pointer rounded-md border duration-300 focus:outline-none md:hidden"
          aria-label="Toggle Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <FontAwesomeIcon icon={faBars} className="fa-fw" />
        </button>
        <Link href="/" className="text-primary text-xl font-bold">Bot de Puré</Link>
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
                href="/modules"
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
            <button
              onClick={rotateTheme}
              className="border-foreground/8 bg-foreground/2 hover:bg-foreground/5 h-8 w-8 cursor-pointer rounded-md border"
            >
              <FontAwesomeIcon icon={faPalette} />
            </button>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export default NavBar
