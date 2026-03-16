import { useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { SerializedGraph } from '../types/graph'
import { saveGraphToFile, loadGraphFromFile } from '../hooks/useFilePersistence'

interface ToolbarProps {
  onAddNode: (position: { x: number; y: number }) => void;
  onSave: () => SerializedGraph;
  onLoad: (graph: SerializedGraph) => void;
}

export default function Toolbar({ onAddNode, onSave, onLoad }: ToolbarProps) {
  const { screenToFlowPosition } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAddNode() {
    // Place new node near the center of the current viewport
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    // Slight random offset to prevent stacking
    onAddNode({ x: position.x + (Math.random() - 0.5) * 80, y: position.y + (Math.random() - 0.5) * 80 })
  }

  function handleSave() {
    const graph = onSave()
    saveGraphToFile(graph)
  }

  function handleLoad() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      loadGraphFromFile(file, onLoad)
      // Reset so the same file can be loaded again if needed
      e.target.value = ''
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '0 16px',
      height: 48,
      background: '#1a1a2e',
      borderBottom: '1px solid #333',
      flexShrink: 0,
    }}>
      <span style={{ fontWeight: 700, fontSize: 15, color: '#e0e0ff', marginRight: 8 }}>
        Feedback Loop
      </span>
      <Button onClick={handleAddNode} primary>+ Add Node</Button>
      <div style={{ flex: 1 }} />
      <Button onClick={handleSave}>Save JSON</Button>
      <Button onClick={handleLoad}>Load JSON</Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}

function Button({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: 600,
        border: primary ? 'none' : '1px solid #555',
        borderRadius: 6,
        cursor: 'pointer',
        background: primary ? '#0070f3' : '#2a2a3e',
        color: '#fff',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      {children}
    </button>
  )
}
