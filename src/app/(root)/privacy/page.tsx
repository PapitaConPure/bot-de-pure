'use client'

import Main from '@/components/layout/Main'
import Section from '@/components/layout/Section'
import PrivacyPolicy from '../../../content/privacy.mdx'

export default function Privacy() {
  return (
    <Main>
      <Section size={'book'}>
        <PrivacyPolicy />
      </Section>
    </Main>
  )
}
