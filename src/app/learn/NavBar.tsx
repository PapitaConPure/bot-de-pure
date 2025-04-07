'use client'

import { faBars, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'
import Link from 'next/link'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import LanguagePicker from '@/components/layout/LanguagePicker'
import { ThemePicker } from '@/components/layout/ThemePicker'
import { Button } from '@/components/ui/button'

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <header className="bg-background/60 border-b-foreground/6 sticky top-0 z-40 flex w-full flex-row items-center justify-between border-b border-solid px-4 py-3 backdrop-blur-xl duration-300">
        <div className="flex flex-row items-center gap-x-2 lg:gap-x-6">
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
            <ul className="animate-colors hidden items-center space-y-0 space-x-4 lg:flex">
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
          <ul className="animate-colors flex items-center space-x-2 lg:space-x-4">
            <li>
              <Button
                variant="outline"
                onClick={() => setOpen(!open)}
                aria-label="Search"
                className="h-9 w-9 cursor-pointer rounded-md border lg:flex lg:min-w-max lg:flex-row lg:items-center lg:justify-center lg:gap-x-2 lg:px-4"
              >
                <FontAwesomeIcon className="text-foreground" icon={faSearch} />
                <span className="hidden lg:block">Buscar...</span>
              </Button>
            </li>
            <li>
              <LanguagePicker />
            </li>
            <li>
              <ThemePicker />
            </li>
          </ul>
        </nav>
      </header>

      <div className="flex flex-row items-center opacity-0 sm:justify-items-center">
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
              <CommandItem>Calculator</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </>
  )
}

export default NavBar
