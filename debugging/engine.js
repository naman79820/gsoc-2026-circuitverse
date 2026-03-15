/* eslint-disable import/no-cycle */
/* eslint-disable no-use-before-define */
/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
/* eslint-disable no-bitwise */
import { layoutModeGet, layoutUpdate } from './layoutMode'
import plotArea from './plotArea'
import { simulationArea } from './simulationArea'
import { dots, canvasMessage, findDimensions, rect2 } from './canvasApi'
import { showProperties, prevPropertyObjGet } from './ux'
import { showError } from './utils'
import miniMapArea from './minimap'
import { resetup } from './setup'
import { verilogModeGet } from './Verilog2CV'
import { renderOrder, updateOrder } from './metadata'
import ContentionPendingData from './contention';
import { stateHistory } from '../debug/StateHistory'
import { breakpointManager } from '../debug/BreakpointManager'
import { signalVisualizer } from '../debug/SignalVisualizer'

// original engine state flags
var wireToBeChecked = 0
export function wireToBeCheckedSet(param) { wireToBeChecked = param }

var willBeUpdated = false
export function willBeUpdatedSet(param) { willBeUpdated = param }

var objectSelection = false
export function objectSelectionSet(param) { objectSelection = param }

var updatePosition = true
export function updatePositionSet(param) { updatePosition = param }

var updateSimulation = true
export function updateSimulationSet(param) { updateSimulation = param }

var updateCanvas = true
export function updateCanvasSet(param) { updateCanvas = param }

var gridUpdate = true
export function gridUpdateSet(param) { gridUpdate = param }
export function gridUpdateGet() { return gridUpdate }

var forceResetNodes = true
export function forceResetNodesSet(param) { forceResetNodes = param }

var errorDetected = false
export function errorDetectedSet(param) { errorDetected = param }
export function errorDetectedGet() { return errorDetected }

export var canvasMessageData = { x: undefined, y: undefined, string: undefined }

// debug mode stuff
var debugMode = false
var pausedByBreakpoint = false

export function debugModeSet(param) {
    debugMode = param
    if (param) { stateHistory.clear(); stateHistory.captureState(globalScope) }
}
export function debugModeGet() { return debugMode }
export function pausedByBreakpointGet() { return pausedByBreakpoint }
export function pausedByBreakpointSet(param) { pausedByBreakpoint = param }

export function resumeSimulation() {
    pausedByBreakpoint = false
    breakpointManager.clearTriggered()
    updateSimulationSet(true)
    scheduleUpdate()
}

// thin wrappers so the UI doesn't import the singletons directly
export function addBreakpoint(config) { return breakpointManager.addBreakpoint(config) }
export function removeBreakpoint(id) { breakpointManager.removeBreakpoint(id) }
export function toggleBreakpoint(id) { breakpointManager.toggleBreakpoint(id) }
export function getAllBreakpoints() { return breakpointManager.getAllBreakpoints() }
export function getTriggeredBreakpoint() { return breakpointManager.getTriggeredBreakpoint() }
export function enableSignalVisualization(speed = 300) { signalVisualizer.enable(speed) }
export function disableSignalVisualization() { signalVisualizer.disable() }
export function getSignalVisualizer() { return signalVisualizer }


var updateSubcircuit = true
export function updateSubcircuitSet(param) {
    if (updateSubcircuit != param) { updateSubcircuit = param; return true }
    updateSubcircuit = param
    return false
}

export function changeLightMode(val) {
    if (!val && lightMode) {
        lightMode = false; DPR = window.devicePixelRatio || 1; globalScope.scale *= DPR
    } else if (val && !lightMode) {
        lightMode = true; globalScope.scale /= DPR; DPR = 1; $('#miniMap').fadeOut('fast')
    }
    resetup()
}

// rendering
export function renderCanvas(scope) {
    if (layoutModeGet() || verilogModeGet()) return
    var ctx = simulationArea.context
    simulationArea.clear()
    if (gridUpdate) { gridUpdateSet(false); dots() }
    canvasMessageData = { x: undefined, y: undefined, string: undefined }

    for (let i = 0; i < renderOrder.length; i++) {
        for (var j = 0; j < scope[renderOrder[i]].length; j++) {
            scope[renderOrder[i]][j].draw()
        }
    }

    // draw signal glow on top of everything
    if (debugMode) signalVisualizer.drawSignals(ctx, scope)

    if (canvasMessageData.string !== undefined) {
        canvasMessage(ctx, canvasMessageData.string, canvasMessageData.x, canvasMessageData.y)
    }
    if (objectSelection) {
        ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = 'black'; ctx.fillStyle = 'rgba(0,0,0,0.1)'
        rect2(ctx, simulationArea.mouseDownX, simulationArea.mouseDownY,
            simulationArea.mouseX - simulationArea.mouseDownX,
            simulationArea.mouseY - simulationArea.mouseDownY, 0, 0, 'RIGHT')
        ctx.stroke(); ctx.fill()
    }
    if (simulationArea.hover !== undefined) simulationArea.canvas.style.cursor = 'pointer'
    else if (simulationArea.mouseDown) simulationArea.canvas.style.cursor = 'grabbing'
    else simulationArea.canvas.style.cursor = 'default'
}

export function updateSelectionsAndPane(scope = globalScope) {
    if (!simulationArea.selected && simulationArea.mouseDown) {
        simulationArea.selected = true
        simulationArea.lastSelected = scope.root
        simulationArea.hover = scope.root
        if (simulationArea.shiftDown) objectSelectionSet(true)
        else if (!embed) { findDimensions(scope); miniMapArea.setup(); $('#miniMap').show() }
    } else if (simulationArea.lastSelected === scope.root && simulationArea.mouseDown) {
        if (!objectSelection) {
            globalScope.ox = Math.round(simulationArea.mouseRawX - simulationArea.mouseDownRawX + simulationArea.oldx)
            globalScope.oy = Math.round(simulationArea.mouseRawY - simulationArea.mouseDownRawY + simulationArea.oldy)
            gridUpdateSet(true)
            if (!embed && !lightMode) miniMapArea.setup()
        }
    } else if (simulationArea.lastSelected === scope.root) {
        simulationArea.lastSelected = undefined; simulationArea.selected = false; simulationArea.hover = undefined
        if (objectSelection) {
            objectSelectionSet(false)
            var x1 = simulationArea.mouseDownX, x2 = simulationArea.mouseX
            var y1 = simulationArea.mouseDownY, y2 = simulationArea.mouseY
            if (x1 > x2) { const t = x1; x1 = x2; x2 = t }
            if (y1 > y2) { const t = y1; y1 = y2; y2 = t }
            for (let i = 0; i < updateOrder.length; i++) {
                for (var j = 0; j < scope[updateOrder[i]].length; j++) {
                    var obj = scope[updateOrder[i]][j]
                    if (simulationArea.multipleObjectSelections.includes(obj)) continue
                    var x, y
                    if (obj.objectType === 'Node') { x = obj.absX(); y = obj.absY() }
                    else if (obj.objectType !== 'Wire') { x = obj.x; y = obj.y }
                    else continue
                    if (x > x1 && x < x2 && y > y1 && y < y2) simulationArea.multipleObjectSelections.push(obj)
                }
            }
        }
    }
}

// simulation loop
export function play(scope = globalScope, resetNodes = false) {
    if (errorDetected || loading === true || pausedByBreakpoint) return

    const previousState = debugMode ? stateHistory.getCurrentState() : null

    simulationArea.simulationQueue.reset()
    plotArea.setExecutionTime()
    resetNodeHighlights(scope)

    if (resetNodes || forceResetNodes) {
        scope.reset(); simulationArea.simulationQueue.reset(); forceResetNodesSet(false)
    }

    simulationArea.contentionPending = new ContentionPendingData()
    scope.addInputs()

    let stepCount = 0, elem
    while (!simulationArea.simulationQueue.isEmpty()) {
        if (errorDetected) { simulationArea.simulationQueue.reset(); return }
        elem = simulationArea.simulationQueue.pop()
        elem.resolve()
        stepCount++
        if (stepCount > 1000000) {
            showError('Simulation Stack limit exceeded: maybe due to cyclic paths or contention')
            forceResetNodesSet(true)
        }
    }

    if (simulationArea.contentionPending.size() > 0) {
        for (const [a, b] of simulationArea.contentionPending.nodes()) { a.highlighted = true; b.highlighted = true }
        forceResetNodesSet(true)
        showError('Contention Error: One or more bus contentions in the circuit (check highlighted nodes)')
    }

    // if debug mode is on, record state and check breakpoints
    if (debugMode && !errorDetected) {
        stateHistory.captureState(scope)
        const cur = stateHistory.getCurrentState()
        if (previousState && cur) signalVisualizer.trackChanges(cur, previousState)

        const hit = breakpointManager.checkBreakpoints(scope, previousState)
        if (hit) {
            pausedByBreakpoint = true
            updateSimulationSet(false)
            console.log('Breakpoint hit:', hit.description)
        }
    }
}

export function resetNodeHighlights(scope) {
    for (const node of scope.allNodes) node.highlighted = false
}

// time-travel stepping
export function stepBack() {
    if (!debugMode) return
    const s = stateHistory.stepBack()
    if (s) { stateHistory.restoreState(globalScope, s); updateCanvasSet(true); scheduleUpdate(1, 0) }
}

export function stepForward() {
    if (!debugMode) return
    if (stateHistory.canStepForward()) {
        const s = stateHistory.stepForward()
        stateHistory.restoreState(globalScope, s); updateCanvasSet(true); scheduleUpdate(1, 0)
    } else {
        play(globalScope)
    }
}

export function jumpToState(index) {
    if (!debugMode) return
    const s = stateHistory.jumpToState(index)
    if (s) { stateHistory.restoreState(globalScope, s); updateCanvasSet(true); scheduleUpdate(1, 0) }
}

export function getStateHistory() {
    return {
        states: stateHistory.getAllStates(),
        currentIndex: stateHistory.currentIndex,
        canStepBack: stateHistory.canStepBack(),
        canStepForward: stateHistory.canStepForward(),
    }
}

// scheduling and main update loop
export function scheduleUpdate(count = 0, time = 100, fn = undefined) {
    if (lightMode) time *= 5
    var updateFn = layoutModeGet() ? layoutUpdate : update
    if (count) { updateFn(); for (let i = 0; i < count; i++) setTimeout(updateFn, 10 + 50 * i) }
    if (willBeUpdated) return
    willBeUpdatedSet(true)
    if (fn) setTimeout(() => { fn(); updateFn() }, time)
    else setTimeout(updateFn, time)
}

export function update(scope = globalScope, updateEverything = false) {
    willBeUpdatedSet(false)
    if (loading === true || layoutModeGet()) return
    simulationArea.hover = undefined

    if (wireToBeChecked || updateEverything) {
        if (wireToBeChecked === 2) wireToBeChecked = 0
        else wireToBeChecked++
        var prevLength = scope.wires.length
        for (let i = 0; i < scope.wires.length; i++) {
            scope.wires[i].checkConnections()
            if (scope.wires.length !== prevLength) { prevLength--; i-- }
        }
        scheduleUpdate()
    }
    if (updateSubcircuit || updateEverything) {
        for (let i = 0; i < scope.SubCircuit.length; i++) scope.SubCircuit[i].reset()
        updateSubcircuitSet(false)
    }
    if (updatePosition || updateEverything) {
        for (let i = 0; i < updateOrder.length; i++)
            for (let j = 0; j < scope[updateOrder[i]].length; j++)
                scope[updateOrder[i]][j].update()
    }
    if (updatePosition || updateEverything) updateSelectionsAndPane(scope)
    if (!embed && simulationArea.mouseDown && simulationArea.lastSelected && simulationArea.lastSelected !== globalScope.root) {
        if (!lightMode) $('#miniMap').fadeOut('fast')
    }
    if (updateSimulation) play()
    if (!embed && prevPropertyObjGet() !== simulationArea.lastSelected) {
        if (simulationArea.lastSelected && simulationArea.lastSelected.objectType !== 'Wire') {
            showProperties(simulationArea.lastSelected)
        }
    }
    if (updateCanvas) renderCanvas(scope)
    updateSimulationSet(false)
    updateCanvas = false
    updatePositionSet(false)
}
