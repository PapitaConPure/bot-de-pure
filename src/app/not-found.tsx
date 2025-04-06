import Link from 'next/link'
import React from 'react'

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <div>
        <div className="relative">
          <h1 className="text-red-500/30 absolute inset-0 animate-[ping_2s_cubic-bezier(0,0,0.25,1)_infinite] text-6xl font-bold sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
            404
          </h1>
          <h1 className="relative text-6xl font-bold sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
            404
          </h1>
        </div>
        <h2 className="-mt-1 mb-2 text-xl font-semibold sm:mt-0 sm:mb-3 sm:text-2xl md:mb-3.5 md:text-3xl lg:mb-4 lg:text-4xl xl:text-5xl">
          No Encontrado
        </h2>
        <p className="mb-6 text-center text-xs sm:mb-8 sm:text-sm md:mb-10 md:text-base lg:mb-12 lg:text-lg">
          La página que buscabas no existe.
        </p>
        <div className="mx-auto flex w-2/3 flex-row items-center justify-center sm:w-5/6">
          <Link
            className="border-foreground/8 bg-foreground/2 hover:bg-foreground/5 flex h-10 w-full items-center justify-center rounded-md border border-solid px-4 text-sm font-medium transition-colors hover:border-transparent sm:h-12 sm:text-base md:w-28 md:px-5"
            href="/"
          >
            <span>Volver</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
