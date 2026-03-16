import { ReactFlowProvider } from '@xyflow/react'
import { useGraphState } from './hooks/useGraphState'
import FlowCanvas from './components/FlowCanvas'
import Toolbar from './components/Toolbar'

function AppInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, addNode, getSerializedGraph, loadGraph } = useGraphState()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Toolbar
        onAddNode={addNode}
        onSave={getSerializedGraph}
        onLoad={loadGraph}
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setEdges={setEdges}
        />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
