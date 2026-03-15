/* eslint-disable import/no-cycle */
import { simulationArea } from '../../simulator/src/simulationArea'

export class SignalVisualizer {
    constructor() {
        this.isEnabled = false
        this.animationSpeed = 150
        this.activeSignals = { wires: new Map(), nodes: new Map() }
        this.previousState = null
    }

    enable(speed = 300) {
        this.isEnabled = true
        this.animationSpeed = speed
        this.activeSignals.wires.clear()
        this.activeSignals.nodes.clear()
    }

    disable() {
        this.isEnabled = false
        this.activeSignals.wires.clear()
        this.activeSignals.nodes.clear()
        this.previousState = null
    }

    trackChanges(currentState, previousState) {
        if (!this.isEnabled || !currentState || !previousState) return
        const now = Date.now()

        if (currentState.wires && previousState.wires) {
            currentState.wires.forEach((w, i) => {
                if (previousState.wires[i] && w.value !== previousState.wires[i].value)
                    this.activeSignals.wires.set(i, { startTime: now, duration: this.animationSpeed })
            })
        }
        if (currentState.nodes && previousState.nodes) {
            currentState.nodes.forEach((n, i) => {
                if (previousState.nodes[i] && n.value !== previousState.nodes[i].value)
                    this.activeSignals.nodes.set(i, { startTime: now, duration: this.animationSpeed })
            })
        }
    }

    drawSignals(ctx, scope) {
        if (!this.isEnabled) return
        const now = Date.now()

        for (const [idx, sig] of this.activeSignals.wires.entries()) {
            const t = 1 - (now - sig.startTime) / sig.duration
            if (t <= 0 || scope.wires?.[idx]?.value === 0) { this.activeSignals.wires.delete(idx); continue }
            const wire = scope.wires[idx]
            if (!wire) continue
            ctx.save()
            ctx.shadowBlur = 15 * t
            ctx.shadowColor = ctx.strokeStyle = `rgba(255,215,0,${t})`
            ctx.lineWidth = 5
            ctx.beginPath(); ctx.moveTo(wire.x1, wire.y1); ctx.lineTo(wire.x2, wire.y2); ctx.stroke()
            ctx.restore()
        }

        for (const [idx, sig] of this.activeSignals.nodes.entries()) {
            const t = 1 - (now - sig.startTime) / sig.duration
            if (t <= 0 || scope.allNodes?.[idx]?.value === 0) { this.activeSignals.nodes.delete(idx); continue }
            const node = scope.allNodes[idx]
            if (!node) continue
            const x = node.absX ? node.absX() : node.x
            const y = node.absY ? node.absY() : node.y
            ctx.save()
            ctx.shadowBlur = 15 * t
            ctx.shadowColor = `rgba(255,215,0,${t})`
            ctx.fillStyle = `rgba(255,215,0,${t * 0.6})`
            ctx.beginPath(); ctx.arc(x, y, 6 * t, 0, Math.PI * 2); ctx.fill()
            ctx.restore()
        }
    }

    getActiveSignalsCount() {
        return this.activeSignals.wires.size + this.activeSignals.nodes.size
    }

    isAnimating() {
        return this.isEnabled && this.getActiveSignalsCount() > 0
    }
}

export const signalVisualizer = new SignalVisualizer()
