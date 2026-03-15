/* eslint-disable import/no-cycle */
import { simulationArea } from '../src/simulationArea'

// Records snapshots of the circuit state so we can step back/forward
// through simulation history (time-travel debugging).
export class StateHistory {
    constructor(maxSize = 1000) {
        this.states = []
        this.currentIndex = -1
        this.maxSize = maxSize
    }

    // Take a snapshot of the current scope and push it onto the timeline.
    // If we stepped back earlier, this drops any "future" states (branch).
    captureState(scope) {
        const state = {
            timestamp: Date.now(),
            timePeriod: simulationArea.timePeriod,
            clockState: simulationArea.clockState,
            scopeId: scope.id,
            scopeName: scope.name,
            elements: this.captureElements(scope),
            nodes: this.captureNodes(scope),
            wires: this.captureWires(scope),
        }

        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1)
        }

        this.states.push(state)

        // circular buffer — drop oldest when full
        if (this.states.length > this.maxSize) {
            this.states.shift()
        } else {
            this.currentIndex++
        }

        return state
    }

    captureElements(scope) {
        const elements = {}

        const moduleList = [
            'Input', 'Output', 'AndGate', 'OrGate', 'NotGate', 'XorGate',
            'NandGate', 'NorGate', 'XnorGate', 'Clock', 'Splitter',
            'SubCircuit', 'ConstantVal', 'BitSelector', 'Multiplexer',
            'Demultiplexer', 'TTY', 'Rom', 'Ram', 'Adder',
        ]

        moduleList.forEach(moduleType => {
            if (scope[moduleType] && Array.isArray(scope[moduleType])) {
                elements[moduleType] = scope[moduleType].map(elem => ({
                    x: elem.x,
                    y: elem.y,
                    direction: elem.direction,
                    objectType: elem.objectType,
                    output: elem.output ? elem.output.value : undefined,
                    inp: elem.inp ? elem.inp.map(i => ({
                        value: i.value,
                        bitWidth: i.bitWidth
                    })) : [],
                    state: elem.state,
                    bitWidth: elem.bitWidth,
                    subcircuitId: elem.id,
                    data: elem.data,
                    enable: elem.enable,
                }))
            }
        })

        return elements
    }

    captureNodes(scope) {
        if (!scope.allNodes) return []

        return scope.allNodes.map(node => ({
            x: node.x,
            y: node.y,
            value: node.value,
            bitWidth: node.bitWidth,
            type: node.type,
            highlighted: node.highlighted || false,
        }))
    }

    captureWires(scope) {
        if (!scope.wires) return []

        return scope.wires.map(wire => ({
            x1: wire.x1,
            y1: wire.y1,
            x2: wire.x2,
            y2: wire.y2,
            value: wire.node1 ? wire.node1.value : undefined,
            bitWidth: wire.node1 ? wire.node1.bitWidth : undefined,
        }))
    }

    restoreState(scope, state) {
        if (!state) return

        simulationArea.clockState = state.clockState
        this._restoreElements(scope, state.elements)
        this._restoreNodes(scope, state.nodes)
        // wires derive from nodes, so they update on their own
    }

    _restoreElements(scope, elementsState) {
        for (const moduleType in elementsState) {
            if (!scope[moduleType] || !Array.isArray(scope[moduleType])) continue

            elementsState[moduleType].forEach((saved, index) => {
                const elem = scope[moduleType][index]
                if (!elem) return

                if (elem.output && saved.output !== undefined) {
                    elem.output.value = saved.output
                }
                if (elem.inp && saved.inp) {
                    saved.inp.forEach((inputState, i) => {
                        if (elem.inp[i]) {
                            elem.inp[i].value = inputState.value
                        }
                    })
                }
                if (saved.state !== undefined) elem.state = saved.state
                if (saved.data !== undefined) elem.data = saved.data
            })
        }
    }

    _restoreNodes(scope, nodesState) {
        if (!scope.allNodes || !nodesState) return

        nodesState.forEach((saved, index) => {
            if (scope.allNodes[index]) {
                scope.allNodes[index].value = saved.value
                scope.allNodes[index].highlighted = saved.highlighted
            }
        })
    }

    stepBack() {
        if (!this.canStepBack()) return null
        this.currentIndex--
        return this.states[this.currentIndex]
    }

    stepForward() {
        if (!this.canStepForward()) return null
        this.currentIndex++
        return this.states[this.currentIndex]
    }

    canStepBack() {
        return this.currentIndex > 0
    }

    canStepForward() {
        return this.currentIndex < this.states.length - 1
    }

    getCurrentState() {
        return this.states[this.currentIndex]
    }

    getAllStates() {
        return this.states
    }

    clear() {
        this.states = []
        this.currentIndex = -1
    }

    jumpToState(index) {
        if (index >= 0 && index < this.states.length) {
            this.currentIndex = index
            return this.states[index]
        }
        return null
    }
}

export const stateHistory = new StateHistory()
