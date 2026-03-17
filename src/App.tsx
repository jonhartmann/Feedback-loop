import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useGraphState } from './hooks/useGraphState'
import { useDataRefresh } from './hooks/useDataRefresh'
import { useLibrary } from './hooks/useLibrary'
import { LibraryContext } from './context/LibraryContext'
import { GraphEvalProvider } from './context/GraphEvalContext'
import FlowCanvas from './components/FlowCanvas'
import Toolbar from './components/Toolbar'
import Drawer from './components/Drawer'
import type { FeedbackNodeData } from './types/graph'

const DRAWER_WIDTH = 260

function AppInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, setNodes, addNode, getSerializedGraph, loadGraph, docName, setDocName } = useGraphState()
  const library = useLibrary()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useDataRefresh(3000)

  function handleSaveNodeToLibrary(nodeData: FeedbackNodeData) {
    library.addItem({
      label: nodeData.label,
      category: 'Custom',
      template: {
        label: nodeData.label,
        variant: nodeData.variant,
        value: nodeData.outputs[0]?.value,
        unit: nodeData.outputs[0]?.unit ?? nodeData.metricUnit,
        sourceUrl: nodeData.sourceUrl,
        inputs: nodeData.inputs,
        outputs: nodeData.outputs,
        variables: nodeData.variables,
        metricFormula: nodeData.metricFormula,
        metricUnit: nodeData.metricUnit,
        description: nodeData.description,
      },
    })
  }

  return (
    <LibraryContext.Provider value={library}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
        <Toolbar
          onAddNode={addNode}
          onSave={getSerializedGraph}
          onLoad={loadGraph}
          docName={docName}
          onDocNameChange={setDocName}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(o => !o)}
        />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <GraphEvalProvider>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setEdges={setEdges}
              setNodes={setNodes}
              addNode={addNode}
              drawerOpen={drawerOpen}
              drawerWidth={DRAWER_WIDTH}
              onSaveNodeToLibrary={handleSaveNodeToLibrary}
            />
          </GraphEvalProvider>
          {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} addNode={addNode} />}
        </div>
      </div>
    </LibraryContext.Provider>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  )
}
