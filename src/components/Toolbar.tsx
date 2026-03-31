import { useRef } from 'react'
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
        <Button onClick={() => handleAddNode('constant')} amber>+ Constant</Button>
        <Button onClick={() => handleAddNode('measure')} teal>+ Measure</Button>
        <Button onClick={() => handleAddNode()}>+ Expression</Button>
        <Button onClick={() => handleAddNode('metric')} violet>+ Metric</Button>
      </div>
      <span data-tour="library-btn"><Button onClick={onToggleDrawer} primary={drawerOpen}>Library</Button></span>

      <div className="toolbar__divider" />

      <span data-tour="experiment-btn"><Button onClick={toggleSimMode} primary={simMode}>Experiment</Button></span>

      <div className="toolbar__spacer" />
      <Button onClick={onShowTemplates}>Templates</Button>
      <Button onClick={onShowHelp}>Help</Button>
      <div className="toolbar__btn-group" data-tour="save-load">
        <Button onClick={handleSave} primary>Save</Button>
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
  primary?: boolean;
  amber?: boolean;
  teal?: boolean;
  violet?: boolean;
}

function Button({ onClick, children, primary, amber, teal, violet }: ButtonProps) {
  const cls = [
    'toolbar__btn',
    primary ? 'toolbar__btn--primary' : '',
    amber   ? 'toolbar__btn--amber'   : '',
    teal    ? 'toolbar__btn--teal'    : '',
    violet  ? 'toolbar__btn--violet'  : '',
  ].filter(Boolean).join(' ')

  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  )
}
