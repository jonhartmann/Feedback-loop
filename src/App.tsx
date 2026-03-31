import { useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useGraphState } from './hooks/useGraphState'
import { useDataRefresh } from './hooks/useDataRefresh'
import { useLibrary } from './hooks/useLibrary'
import { LibraryContext } from './context/LibraryContext'
import { GraphEvalProvider } from './context/GraphEvalContext'
import { SimProvider } from './context/SimContext'
import { TourProvider, useTour } from './context/TourContext'
import FlowCanvas from './components/FlowCanvas'
import Toolbar from './components/Toolbar'
import Drawer from './components/Drawer'
import WelcomeOverlay from './components/WelcomeOverlay'
import HelpModal from './components/HelpModal'
import Tour from './components/Tour'
import type { FeedbackNodeData, SerializedGraph } from './types/graph'
import { nodeDataToTemplate } from './utils/nodeTemplate'
import { STARTERS } from './data/starterGraphs'

const DRAWER_WIDTH = 260

// The Website Metrics starter is a clear, mid-size graph good for the tour
const TOUR_DEMO_GRAPH = STARTERS.find(s => s.title === 'Website Metrics Flow')?.graph

function AppInner() {
  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, setNodes, addNode, getSerializedGraph, loadGraph, docName, setDocName } = useGraphState()
  const library = useLibrary()
  const { startTour } = useTour()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem('feedback-loop-welcomed')
  )
  const [showHelp, setShowHelp] = useState(false)

  function handleWelcomeSelect(graph?: SerializedGraph) {
    if (graph) loadGraph(graph)
    localStorage.setItem('feedback-loop-welcomed', '1')
    setShowWelcome(false)
  }

  function handleStartTour() {
    if (TOUR_DEMO_GRAPH) loadGraph(TOUR_DEMO_GRAPH)
    localStorage.setItem('feedback-loop-welcomed', '1')
    setShowWelcome(false)
    setShowHelp(false)
    startTour()
  }

  useDataRefresh(3000)

  function handleSaveNodeToLibrary(nodeData: FeedbackNodeData) {
    library.addItem({ label: nodeData.label, category: 'Custom', template: nodeDataToTemplate(nodeData) })
  }

  return (
    <LibraryContext.Provider value={library}>
      <GraphEvalProvider>
        <SimProvider>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
            <Toolbar
              onAddNode={addNode}
              onSave={getSerializedGraph}
              onLoad={loadGraph}
              docName={docName}
              onDocNameChange={setDocName}
              drawerOpen={drawerOpen}
              onToggleDrawer={() => setDrawerOpen(o => !o)}
              onShowTemplates={() => setShowWelcome(true)}
              onShowHelp={() => setShowHelp(true)}
            />
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#F6F8F9' }}>
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
              {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} addNode={addNode} />}
              {showWelcome && <WelcomeOverlay onSelect={handleWelcomeSelect} onStartTour={handleStartTour} />}
              {showHelp && <HelpModal onClose={() => setShowHelp(false)} onStartTour={handleStartTour} />}
              <Tour />
            </div>
          </div>
        </SimProvider>
      </GraphEvalProvider>
    </LibraryContext.Provider>
  )
}

export default function App() {
  return (
    <ReactFlowProvider>
      <TourProvider>
        <AppInner />
      </TourProvider>
    </ReactFlowProvider>
  )
}
