/* eslint-disable import/no-cycle */
import { simulationArea } from '../src/simulationArea'
import { findNodeAtPosition, getTooltipData, getWatchData } from './canvasDebugHelpers'

let tooltipRef = null
let active = false

export function initCanvasDebugListeners(tooltip) {
    tooltipRef = tooltip
    const c = simulationArea.canvas
    if (!c) return
    c.addEventListener('mousemove', onMove)
    c.addEventListener('click', onClick)
}

export function setCanvasDebugMode(on) {
    active = on
    if (!on && tooltipRef) tooltipRef.hide()
}

function toCanvasCoords(e) {
    const r = simulationArea.canvas.getBoundingClientRect()
    return {
        x: (e.clientX - r.left - globalScope.ox) / globalScope.scale,
        y: (e.clientY - r.top - globalScope.oy) / globalScope.scale
    }
}

function onMove(e) {
    if (!active || !tooltipRef) return
    const { x, y } = toCanvasCoords(e)
    const hit = findNodeAtPosition(x, y, globalScope)
    if (hit) {
        const d = getTooltipData(hit)
        if (d) tooltipRef.show(e.clientX, e.clientY, d)
    } else {
        tooltipRef.hide()
    }
}

function onClick(e) {
    if (!active || simulationArea.lastSelected) return
    const { x, y } = toCanvasCoords(e)
    const hit = findNodeAtPosition(x, y, globalScope)
    if (hit) {
        const w = getWatchData(hit)
        if (w && window.addToWatchPanel) window.addToWatchPanel(w)
    }
}

export function cleanupCanvasDebugListeners() {
    const c = simulationArea.canvas
    if (c) { c.removeEventListener('mousemove', onMove); c.removeEventListener('click', onClick) }
}
