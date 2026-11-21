import React, { useState, useRef, useEffect } from 'react'
import { GraphNode, GraphEdge, GraphWorkflow } from '../types/models'

interface GraphCanvasProps {
  workflow: GraphWorkflow
  onNodeAdd: (node: GraphNode) => void
  onEdgeAdd: (edge: GraphEdge) => void
  onNodeDelete: (nodeId: string) => void
  onEdgeDelete: (edgeId: string) => void
  onNodeSelect: (nodeId: string) => void
}

export function GraphCanvas({ workflow, onNodeAdd, onEdgeAdd, onNodeDelete, onEdgeDelete, onNodeSelect }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Render nodes
    const handleMouseDown = (e: MouseEvent, nodeId: string) => {
      setSelectedNode(nodeId)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
      })
      setIsPanning(false)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedNode || !isPanning) return
      if (canvasRef.current) {
        setPanOffset({
          x: dragStart.x - e.clientX,
          y: dragStart.y - e.clientY,
        })
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    const handleDoubleClick = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left + panOffset.x
      const y = e.clientY - rect.top + panOffset.y
      onNodeAdd({
        id: uuidv4(),
        type: 'model',
        position: { x, y },
        data: {},
      })
    }

    canvasRef.current?.addEventListener('mousedown', (e) => {
      if (e.target === canvasRef.current) handleDoubleClick(e)
    })

    canvasRef.current?.addEventListener('mousemove', handleMouseMove)
    canvasRef.current?.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvasRef.current?.removeEventListener('mousedown', handleDoubleClick)
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp)
    }
  }, [canvasRef, selectedNode, isPanning, panOffset, dragStart, onNodeAdd, onNodeSelect])

  return (
    <div
      ref={canvasRef}
      className="graph-canvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        border: '1px solid #dee2e6',
        overflow: 'auto',
        backgroundColor: '#f8f9fa',
        cursor: 'default',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setIsPanning(true)
      }}
      onMouseUp={handleMouseUp}
    >
      {/* Edges */}
      {workflow.edges.map((edge) => (
        <EdgeLine
          key={edge.id}
          source={edge.source}
          target={edge.target}
          workflow={workflow}
        />
      ))}

      {/* Nodes */}
      {workflow.nodes.map((node) => (
        <GraphNodeView
          key={node.id}
          node={node}
          isSelected={selectedNode === node.id}
          onDelete={onNodeDelete}
          onSelect={onNodeSelect}
        />
      ))}

      {/* Add node button area - simple UI */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px',
          zIndex: 10,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNodeAdd({
              id: uuidv4(),
              type: 'model',
              position: { x: 100, y: 100 },
              data: {},
            })
          }}
          style={{ marginBottom: '4px' }}
        >
          Add Model Node
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNodeAdd({
              id: uuidv4(),
              type: 'scheduler',
              position: { x: 100, y: 180 },
              data: {},
            })
          }}
        >
          Add Scheduler
        </button>
      </div>
    </div>
  )
}

function EdgeLine({ key, source, target, workflow }: { key: string; source: string; target: string; workflow: GraphWorkflow }) {
  const sourceNode = workflow.nodes.find((n) => n.id === source)
  const targetNode = workflow.nodes.find((n) => n.id === target)
  
  if (!sourceNode || !targetNode) return null

  const sourcePos = sourceNode.position
  const targetPos = targetNode.position

  const startX = sourcePos.x + 20
  const startY = sourcePos.y + 20
  const endX = targetPos.x + 20
  const endY = targetPos.y + 20

  const pathString = `
    M ${startX} ${startY}
    C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}
  `

  return (
    <svg key={key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <path
        d={pathString}
        stroke="#6c757d"
        strokeWidth={2}
        fill="none"
        style={{ pointerEvents: 'none' }}
      />
      <circle
        cx={endX}
        cy={endY}
        r={6}
        fill="#6c757d"
        style={{ pointerEvents: 'none' }}
      />
    </svg>
  )
}

function GraphNodeView({
  node,
  isSelected,
  onDelete,
  onSelect,
}: {
  node: GraphNode
  isSelected: boolean
  onDelete: (nodeId: string) => void
  onSelect: (nodeId: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      dragOffset.current = {
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y,
      }
      onSelect(node.id)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !canvasRef.current) return
      setIsDragging(true)
      // Note: this is simplified - real impl would track the ref
    }

    const handleMouseUp = () => setIsDragging(false)

    canvasRef.current?.addEventListener('mousedown', handleMouseDown)
    canvasRef.current?.addEventListener('mousemove', handleMouseMove)
    canvasRef.current?.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvasRef.current?.removeEventListener('mousedown', handleMouseDown)
      canvasRef.current?.removeEventListener('mousemove', handleMouseMove)
      canvasRef.current?.removeEventListener('mouseup', handleMouseUp)
    }
  }, [node, isDragging, onSelect, canvasRef])

  if (isSelected) {
    return (
      <div
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          width: '120px',
          height: '80px',
          background: 'rgba(100, 149, 237, 0.3)',
          border: '2px solid #6495ed',
          borderRadius: '4px',
          padding: '8px',
          zIndex: 5,
          cursor: 'grab',
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div style={{ fontSize: '10px', color: '#6495ed', fontWeight: 'bold' }}>{node.type}</div>
        <button
          style={{
            position: 'absolute',
            right: '4px',
            top: '4px',
            background: 'transparent',
            border: 'none',
            color: '#6495ed',
            fontSize: '12px',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: '120px',
        height: '80px',
        background: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '8px',
        zIndex: 3,
        cursor: 'move',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div style={{ fontSize: '10px', color: '#6c757d' }}>{node.type}</div>
    </div>
  )
}

// Helper to generate UUIDv4
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
