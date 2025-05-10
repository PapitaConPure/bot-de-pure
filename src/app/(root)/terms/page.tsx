'use client'

import Main from '@/components/layout/Main'
import Section from '@/components/layout/Section'
import TermsOfService from '../../../content/tos.mdx'

export default function Terms() {
  return (
    <Main>
      <Section size={'book'}>
        <TermsOfService />
      </Section>
    </Main>
  )
}
