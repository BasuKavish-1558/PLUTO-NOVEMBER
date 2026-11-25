import { motion } from 'motion/react'
import { spring } from '@/lib/motion'

/** Animated highlight that slides between active nav items. */
export function NavPill({ id, className }: { id: string; className: string }) {
  return <motion.span layoutId={id} transition={spring} className={className} aria-hidden />
}
