import type { ComponentPropsWithoutRef } from 'react'

/** Shared visual wrapper for collections without a Panel heading. */
export function ContentSurface({ className = '', ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={'content-surface content-surface--stack ' + className} {...props} />
}
