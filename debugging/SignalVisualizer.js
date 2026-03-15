/* eslint-disable import/no-cycle */
import { simulationArea } from '../../simulator/src/simulationArea'

/**
 * Visualizes signal propagation through the circuit with animations
 * @category debug
 */
export class SignalVisualizer {
    constructor() {
        this.isEnabled = false
        this.animationSpeed = 150 // ms for glow animation

        // One active animation per wire / node (NO stacking)
        this.activeSignals = {
            wires: new Map(), // wireIndex -> { startTime, duration }
            nodes: new Map()  // nodeIndex -> { startTime, duration }
        }

        this.previousState = null
    }

    /**
     * Enable signal visualization
     * @param {number} speed - Animation speed in milliseconds
     */
    enable(speed = 300) {
        // Auto-adjust speed based on clock period if available
        if (typeof simulationArea !== 'undefined' && simulationArea.timePeriod) {
            speed = Math.max(
                50,
                Math.min(500, simulationArea.timePeriod * 0.3)
            )
            console.log(
                '⚡ Auto-adjusted animation speed to',
                speed,
                'ms (clock:',
                simulationArea.timePeriod,
                'ms)'
            )
        }

        this.isEnabled = true
        this.animationSpeed = speed

        this.activeSignals.wires.clear()
        this.activeSignals.nodes.clear()
    }

    /**
     * Disable signal visualization
     */
    disable() {
        this.isEnabled = false
        this.activeSignals.wires.clear()
        this.activeSignals.nodes.clear()
        this.previousState = null
    }

    /**
     * Track signal changes between states
     * @param {Object} currentState - Current circuit state
     * @param {Object} previousState - Previous circuit state
     */
    trackChanges(currentState, previousState) {
        if (!this.isEnabled) return
        if (!currentState || !previousState) return

        const now = Date.now()

        // Wires that changed
        const changedWires = this.findChangedWires(
            currentState.wires,
            previousState.wires
        )

        // Nodes that changed
        const changedNodes = this.findChangedNodes(
            currentState.nodes,
            previousState.nodes
        )

        // Start / replace wire animations
        changedWires.forEach((wireIndex) => {
            this.activeSignals.wires.set(wireIndex, {
                startTime: now,
                duration: this.animationSpeed
            })
        })

        // Start / replace node animations
        changedNodes.forEach((nodeIndex) => {
            this.activeSignals.nodes.set(nodeIndex, {
                startTime: now,
                duration: this.animationSpeed
            })
        })
    }

    /**
     * Find which wires changed between states
     */
    findChangedWires(currentWires, previousWires) {
        const changed = []

        if (!currentWires || !previousWires) return changed

        currentWires.forEach((wire, index) => {
            if (previousWires[index]) {
                if (wire.value !== previousWires[index].value) {
                    changed.push(index)
                }
            }
        })

        return changed
    }

    /**
     * Find which nodes changed between states
     */
    findChangedNodes(currentNodes, previousNodes) {
        const changed = []

        if (!currentNodes || !previousNodes) return changed

        currentNodes.forEach((node, index) => {
            if (previousNodes[index]) {
                if (node.value !== previousNodes[index].value) {
                    changed.push(index)
                }
            }
        })

        return changed
    }

    /**
     * Draw signal animations on canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Scope} scope
     */
    drawSignals(ctx, scope) {
        if (!this.isEnabled) return

        const now = Date.now()

        // ---- WIRES ----
        for (const [wireIndex, signal] of this.activeSignals.wires.entries()) {
            const elapsed = now - signal.startTime

            // Expired
            if (elapsed >= signal.duration) {
                this.activeSignals.wires.delete(wireIndex)
                continue
            }

            // Safety: never glow if wire is currently 0
            if (scope.wires?.[wireIndex]?.value === 0) {
                this.activeSignals.wires.delete(wireIndex)
                continue
            }

            const intensity = 1 - elapsed / signal.duration
            this.drawWireGlow(ctx, scope, wireIndex, intensity)
        }

        // ---- NODES ----
        for (const [nodeIndex, signal] of this.activeSignals.nodes.entries()) {
            const elapsed = now - signal.startTime

            // Expired
            if (elapsed >= signal.duration) {
                this.activeSignals.nodes.delete(nodeIndex)
                continue
            }

            // Safety: never glow if node is currently 0
            if (scope.allNodes?.[nodeIndex]?.value === 0) {
                this.activeSignals.nodes.delete(nodeIndex)
                continue
            }

            const intensity = 1 - elapsed / signal.duration
            this.drawNodeGlow(ctx, scope, nodeIndex, intensity)
        }
    }

    /**
     * Draw glowing effect on a wire
     */
    drawWireGlow(ctx, scope, wireIndex, intensity) {
        if (!scope.wires || !scope.wires[wireIndex]) return

        const wire = scope.wires[wireIndex]

        ctx.save()

        // Outer glow
        ctx.shadowBlur = 15 * intensity
        ctx.shadowColor = `rgba(255, 215, 0, ${intensity})`
        ctx.strokeStyle = `rgba(255, 215, 0, ${intensity * 0.8})`
        ctx.lineWidth = 6

        ctx.beginPath()
        ctx.moveTo(wire.x1, wire.y1)
        ctx.lineTo(wire.x2, wire.y2)
        ctx.stroke()

        // Inner bright pulse
        ctx.shadowBlur = 25 * intensity
        ctx.strokeStyle = `rgba(255, 255, 120, ${intensity})`
        ctx.lineWidth = 3

        ctx.beginPath()
        ctx.moveTo(wire.x1, wire.y1)
        ctx.lineTo(wire.x2, wire.y2)
        ctx.stroke()

        ctx.restore()
    }

    /**
     * Draw glowing effect on a node
     */
    drawNodeGlow(ctx, scope, nodeIndex, intensity) {
        if (!scope.allNodes || !scope.allNodes[nodeIndex]) return

        const node = scope.allNodes[nodeIndex]
        const x = node.absX ? node.absX() : node.x
        const y = node.absY ? node.absY() : node.y

        ctx.save()

        // Outer glow
        ctx.shadowBlur = 20 * intensity
        ctx.shadowColor = `rgba(255, 215, 0, ${intensity})`
        ctx.fillStyle = `rgba(255, 215, 0, ${intensity * 0.6})`

        ctx.beginPath()
        ctx.arc(x, y, 8 * intensity, 0, Math.PI * 2)
        ctx.fill()

        // Inner core
        ctx.shadowBlur = 10 * intensity
        ctx.fillStyle = `rgba(255, 255, 120, ${intensity})`

        ctx.beginPath()
        ctx.arc(x, y, 4 * intensity, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
    }

    /**
     * Get active signals count
     */
    getActiveSignalsCount() {
        return (
            this.activeSignals.wires.size +
            this.activeSignals.nodes.size
        )
    }

    /**
     * Check if currently animating
     */
    isAnimating() {
        return (
            this.isEnabled &&
            (this.activeSignals.wires.size > 0 ||
                this.activeSignals.nodes.size > 0)
        )
    }
}

// Export singleton instance
export const signalVisualizer = new SignalVisualizer()
