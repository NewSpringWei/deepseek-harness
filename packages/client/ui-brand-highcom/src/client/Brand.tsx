import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { PRODUCT_NAME } from './locale.ts'
import { BRAND_MARK_DATA_URI } from './mark.ts'

/**
 * Render the deployment mark at the sidebar's requested edge.
 * @param props - Host-supplied mark presentation.
 * @returns the brand mark image.
 */
export function HighcomBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  return <img src={BRAND_MARK_DATA_URI} width={size} height={size} alt="" />
}

/**
 * Render the deployment name beside the expanded mark. The sidebar's brand row
 * owns the type's size, weight, and baseline, so this occupant contributes the
 * text alone and inherits the shell's own typeface.
 * @returns the product name.
 */
export function HighcomBrandName() {
  return <span>{PRODUCT_NAME}</span>
}

/**
 * Render the mark before the blank-session headline, keeping the hero's own
 * mark geometry through the host class.
 * @param props - Hero-supplied mark presentation.
 * @returns the brand mark image.
 */
export function HighcomHeroBrandMark({ size, className }: HeroBrandMarkOwnerProps) {
  return <img src={BRAND_MARK_DATA_URI} width={size} height={size} className={className} alt="" />
}
