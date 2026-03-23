/**
 * Returns the explicit display mode for a FeedbackNode.
 *
 * - 'sim'      — experiment mode; node shows sliders, editing disabled
 * - 'expanded' — hovered, focused, or pinned (label/port editing, editor open)
 * - 'collapsed' — default; shows summary overlay only
 */
export function useNodeDisplayMode(
  simMode: boolean,
  isHovered: boolean,
  isFocused: boolean,
  isPinned: boolean,
): 'collapsed' | 'expanded' | 'sim' {
  if (simMode) return 'sim'
  if (isHovered || isFocused || isPinned) return 'expanded'
  return 'collapsed'
}
