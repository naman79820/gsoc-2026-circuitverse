/* eslint-disable import/no-cycle */
import { simulationArea } from '../src/simulationArea'
import { findNodeAtPosition, getTooltipData, getWatchData } from './canvasDebugHelpers'

let tooltipComponent = null
let debugModeEnabled = false

/**
 * Initialize canvas debug listeners
 * @param {Object} tooltip - Vue tooltip component instance
 */
export function initCanvasDebugListeners(tooltip) {
    tooltipComponent = tooltip

    const canvas = simulationArea.canvas
    if (!canvas) return

    // Add mousemove listener for tooltips
    canvas.addEventListener('mousemove', handleMouseMove)
    
    // Add click listener for watch panel
    canvas.addEventListener('click', handleClick)
}

/**
 * Enable/disable debug mode
 */
export function setCanvasDebugMode(enabled) {
    debugModeEnabled = enabled
    
    if (!enabled && tooltipComponent) {
        tooltipComponent.hide()
    }
}

/**
 * Handle mouse move for tooltips
 */
function handleMouseMove(event) {
    if (!debugModeEnabled || !tooltipComponent) return

    const rect = simulationArea.canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - globalScope.ox) / globalScope.scale
    const y = (event.clientY - rect.top - globalScope.oy) / globalScope.scale

    const nodeInfo = findNodeAtPosition(x, y, globalScope)

    if (nodeInfo) {
        const tooltipData = getTooltipData(nodeInfo)
        if (tooltipData) {
            tooltipComponent.show(event.clientX, event.clientY, tooltipData)
        }
    } else {
        tooltipComponent.hide()
    }
}

/**
 * Handle click to add to watch panel
 */
function handleClick(event) {
    if (!debugModeEnabled) return

    // Don't interfere with other clicks
    if (simulationArea.lastSelected) return

    const rect = simulationArea.canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - globalScope.ox) / globalScope.scale
    const y = (event.clientY - rect.top - globalScope.oy) / globalScope.scale

    const nodeInfo = findNodeAtPosition(x, y, globalScope)

    if (nodeInfo) {
        const watchData = getWatchData(nodeInfo)
        if (watchData && window.addToWatchPanel) {
            window.addToWatchPanel(watchData)
        }
    }
}

/**
 * Cleanup listeners
 */
export function cleanupCanvasDebugListeners() {
    const canvas = simulationArea.canvas
    if (!canvas) return

    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('click', handleClick)
}
