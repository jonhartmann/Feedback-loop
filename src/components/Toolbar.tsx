import { useRef } from 'react'
import { useReactFlow } from '@xyflow/react'
import type { NodeVariant, SerializedGraph } from '../types/graph'
import { saveGraphToFile, loadGraphFromFile } from '../hooks/useFilePersistence'
import { useSimContext } from '../context/SimContext'

interface ToolbarProps {
  onAddNode: (position: { x: number; y: number }, variant?: NodeVariant) => void;
  onSave: () => SerializedGraph;
  onLoad: (graph: SerializedGraph) => void;
  docName: string;
  onDocNameChange: (name: string) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onShowTemplates: () => void;
}

export default function Toolbar({ onAddNode, onSave, onLoad, docName, onDocNameChange, drawerOpen, onToggleDrawer, onShowTemplates }: ToolbarProps) {
  const { screenToFlowPosition } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { simMode, toggleSimMode } = useSimContext()

  function handleAddNode(variant?: NodeVariant) {
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    onAddNode(position, variant)
  }

  function handleSave() {
    const graph = onSave()
    saveGraphToFile(graph, docName || undefined)
  }

  function handleLoad() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      loadGraphFromFile(file, onLoad)
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
      <span style={{ fontWeight: 700, fontSize: 15, color: '#e0e0ff', flexShrink: 0 }}>
        Feedback Loop
      </span>

      <span style={{ color: '#555', fontSize: 14, flexShrink: 0 }}>›</span>

      <input
        value={docName}
        onChange={e => onDocNameChange(e.target.value)}
        placeholder="Untitled"
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid transparent',
          color: '#c0c0e0',
          fontSize: 14,
          fontWeight: 500,
          padding: '1px 4px',
          outline: 'none',
          minWidth: 80,
          maxWidth: 240,
          width: `${Math.max(80, (docName || 'Untitled').length * 8.5)}px`,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderBottomColor = '#666')}
        onBlur={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
        title="Document name (used as filename when saving)"
      />

      <div style={{ width: 1, background: '#444', alignSelf: 'stretch', margin: '8px 4px' }} />

      <Button onClick={() => handleAddNode('constant')} amber>+ Constant</Button>
      <Button onClick={() => handleAddNode('measure')} teal>+ Measure</Button>
      <Button onClick={() => handleAddNode()}>+ Expression</Button>
      <Button onClick={() => handleAddNode('metric')} violet>+ Metric</Button>
      <Button onClick={onToggleDrawer} primary={drawerOpen}>Library</Button>

      <div style={{ width: 1, background: '#444', alignSelf: 'stretch', margin: '8px 4px' }} />

      <Button onClick={toggleSimMode} primary={simMode}>Experiment</Button>

      <div style={{ flex: 1 }} />
      <Button onClick={onShowTemplates}>Templates</Button>
      <Button onClick={handleSave} primary>Save</Button>
      <Button onClick={handleLoad}>Load</Button>
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

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  amber?: boolean;
  teal?: boolean;
  violet?: boolean;
}

function Button({ onClick, children, primary, amber, teal, violet }: ButtonProps) {
  // Colors match the node border/badge palette for each variant
  const bg = primary ? '#0070f3' : amber ? '#7a5500' : teal ? '#1a6bb5' : violet ? '#7c3aed' : '#2a2a3e'
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: 600,
        border: (primary || amber || teal || violet) ? 'none' : '1px solid #555',
        borderRadius: 6,
        cursor: 'pointer',
        background: bg,
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
