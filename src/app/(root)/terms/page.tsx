'use client'

import TermsOfService from '../../../content/tos.mdx'

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center gap-y-10 scroll-smooth font-[family-name:var(--font-geist-sans)] motion-reduce:scroll-auto">
      <section className="my-12 max-w-180 px-8 sm:px-10 md:px-8 lg:px-10 xl:px-12">
        <TermsOfService />
      </section>
    </main>
  )
}
