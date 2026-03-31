import { useRef } from 'react'
import clsx from 'clsx'
import { useReactFlow } from '@xyflow/react'
import type { NodeVariant, SerializedGraph } from '../types/graph'
import { saveGraphToFile, loadGraphFromFile } from '../hooks/useFilePersistence'
import { useSimContext } from '../context/SimContext'
import './Toolbar.css'

interface ToolbarProps {
  onAddNode: (position: { x: number; y: number }, variant?: NodeVariant) => void;
  onSave: () => SerializedGraph;
  onLoad: (graph: SerializedGraph) => void;
  docName: string;
  onDocNameChange: (name: string) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onShowTemplates: () => void;
  onShowHelp: () => void;
}

export default function Toolbar({ onAddNode, onSave, onLoad, docName, onDocNameChange, drawerOpen, onToggleDrawer, onShowTemplates, onShowHelp }: ToolbarProps) {
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
    <div className="toolbar">
      <span className="toolbar__title">Feedback Loop</span>
      <span className="toolbar__chevron">›</span>

      <input
        className="toolbar__doc-name"
        value={docName}
        onChange={e => onDocNameChange(e.target.value)}
        placeholder="Untitled"
        style={{ width: `${Math.max(80, (docName || 'Untitled').length * 8.5)}px` }}
        title="Document name (used as filename when saving)"
      />

      <div className="toolbar__divider" />

      <div className="toolbar__btn-group" data-tour="node-buttons">
        <Button onClick={() => handleAddNode('constant')} variant="constant">+ Constant</Button>
        <Button onClick={() => handleAddNode('measure')} variant="measure">+ Measure</Button>
        <Button onClick={() => handleAddNode()} variant="expression">+ Expression</Button>
        <Button onClick={() => handleAddNode('metric')} variant="metric">+ Metric</Button>
      </div>
      <span data-tour="library-btn"><Button onClick={onToggleDrawer} active={drawerOpen}>Library</Button></span>

      <div className="toolbar__divider" />

      <span data-tour="experiment-btn"><Button onClick={toggleSimMode} active={simMode}>Experiment</Button></span>

      <div className="toolbar__spacer" />
      <Button onClick={onShowTemplates}>Templates</Button>
      <Button onClick={onShowHelp}>Help</Button>
      <div className="toolbar__btn-group" data-tour="save-load">
        <Button onClick={handleSave} active>Save</Button>
        <Button onClick={handleLoad}>Load</Button>
      </div>
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
  variant?: 'constant' | 'measure' | 'metric' | 'expression';
  active?: boolean;
}

function Button({ onClick, children, variant, active }: ButtonProps) {
  const cls = clsx('toolbar__btn', {
    [`toolbar__btn--${variant}`]: !!variant,
    'toolbar__btn--active':       !!active,
  })

  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  )
}
