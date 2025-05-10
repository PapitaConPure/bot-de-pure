import React, { PropsWithChildren } from 'react'

const Main = ({ children, ...props }: PropsWithChildren) => {
  return <main className="flex w-full flex-col items-center gap-y-10 scroll-smooth font-[family-name:var(--font-geist-sans)] motion-reduce:scroll-auto" {...props}>{children}</main>
}

export default Main
