import { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import React, { ComponentPropsWithoutRef } from 'react'
import { highlight } from 'sugar-high'

type HeadingProps = ComponentPropsWithoutRef<'h1'>
type ParagraphProps = ComponentPropsWithoutRef<'p'>
type ListProps = ComponentPropsWithoutRef<'ul'>
type ListItemProps = ComponentPropsWithoutRef<'li'>
type EmphasisProps = ComponentPropsWithoutRef<'em'>
type StrongProps = ComponentPropsWithoutRef<'strong'>
type AnchorProps = ComponentPropsWithoutRef<'a'>
type CodeProps = ComponentPropsWithoutRef<'code'>
type BlockQuoteProps = ComponentPropsWithoutRef<'blockquote'>

const components: MDXComponents = {
  h1: (props: HeadingProps) => (
    <h1 className="mt-10 mb-6 text-2xl font-extrabold md:text-3xl" {...props} />
  ),
  h2: (props: HeadingProps) => (
    <h2 className="mt-8 mb-3 text-xl font-bold md:text-2xl" {...props} />
  ),
  h3: (props: HeadingProps) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold md:text-xl" {...props} />
  ),
  h4: (props: HeadingProps) => (
    <h3 className="mt-6 mb-2 text-base font-extrabold md:text-lg" {...props} />
  ),
  h5: (props: HeadingProps) => (
    <h3 className="mt-6 mb-2 text-sm font-extrabold md:text-base" {...props} />
  ),
  h6: (props: HeadingProps) => (
    <h3 className="mt-6 mb-2 text-xs font-extrabold md:text-sm" {...props} />
  ),
  p: (props: ParagraphProps) => <p className="mt-4 mb-1" {...props} />,
  ol: (props: ListProps) => (
    <ol
      className="mt-4 mb-6 list-inside list-decimal space-y-3 sm:ml-6 sm:list-outside sm:*:pl-2"
      {...props}
    />
  ),
  ul: (props: ListProps) => (
    <ul
      className="mt-4 mb-6 list-inside list-disc space-y-3 sm:ml-6 sm:list-outside"
      {...props}
    />
  ),
  li: (props: ListItemProps) => <li {...props} />,
  em: (props: EmphasisProps) => <em className="mr-0.25 italic" {...props} />,
  strong: (props: StrongProps) => (
    <strong className="font-semibold" {...props} />
  ),
  a: ({ href, children, ...props }: AnchorProps) => {
    const className =
      'text-accent hover:text-accent/80 hover:underline transition-colors'

    if (href?.startsWith('/')) {
      return (
        <Link href={href} className={className} {...props}>
          {children}
        </Link>
      )
    }
    if (href?.startsWith('#')) {
      return (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        {children}
      </a>
    )
  },
  code: ({ children, ...props }: CodeProps) => {
    const codeHTML = highlight(children as string)
    return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
  },
  Table: ({ data }: { data: { headers: string[]; rows: string[][] } }) => (
    <table>
      <thead>
        <tr>
          {data.headers.map((header, i) => (
            <th key={i}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  blockquote: (props: BlockQuoteProps) => (
    <blockquote
      className="border-l-secondary rounded-l-sm border-l-4 pl-3"
      {...props}
    />
  ),
}

export function useMDXComponents(
  otherComponents: MDXComponents,
): MDXComponents {
  return {
    ...otherComponents,
    ...components,
  }
}
