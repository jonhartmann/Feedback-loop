import type { SerializedGraph } from '../types/graph'

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  ) || 'feedback-loop'
}

export function saveGraphToFile(graph: SerializedGraph, name?: string): void {
  const filename = `${slugify(name ?? graph.name ?? '')}.json`
  const json = JSON.stringify(graph, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function loadGraphFromFile(
  file: File,
  onLoaded: (graph: SerializedGraph) => void
): void {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const raw = e.target?.result
      if (typeof raw !== 'string') throw new Error('Could not read file')
      const parsed = JSON.parse(raw)
      if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid feedback-loop file format')
      }
      onLoaded(parsed as SerializedGraph)
    } catch (err) {
      alert(`Failed to load file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  reader.readAsText(file)
}
