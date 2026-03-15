/* eslint-disable import/no-cycle */

// Handles breakpoint creation, evaluation, and tracking for the debug mode
export class BreakpointManager {
    constructor() {
        this.breakpoints = []
        this.nextId = 1
        this.triggeredBreakpoint = null
    }

    addBreakpoint(config) {
        const breakpoint = {
            id: this.nextId++,
            enabled: true,
            hitCount: 0,
            description: this._describeCondition(config),
            ...config
        }
        this.breakpoints.push(breakpoint)
        return breakpoint
    }

    _describeCondition(config) {
        if (config.wireId) {
            const labels = {
                'equals': `= ${config.value}`,
                'changes': 'changes',
                'risingEdge': '0→1',
                'fallingEdge': '1→0'
            }
            return `Wire ${config.wireId} ${labels[config.condition] || config.condition}`
        }
        if (config.componentId) {
            return `Component ${config.componentId} ${config.condition}`
        }
        return 'Custom breakpoint'
    }

    removeBreakpoint(id) {
        this.breakpoints = this.breakpoints.filter(bp => bp.id !== id)
    }

    toggleBreakpoint(id) {
        const bp = this.breakpoints.find(bp => bp.id === id)
        if (bp) bp.enabled = !bp.enabled
    }

    // Runs through all active breakpoints and returns the first one that fires
    checkBreakpoints(scope, previousState) {
        for (const bp of this.breakpoints) {
            if (!bp.enabled) continue

            if (this.evaluateBreakpoint(bp, scope, previousState)) {
                bp.hitCount++
                this.triggeredBreakpoint = bp
                return bp
            }
        }
        return null
    }

    evaluateBreakpoint(bp, scope, previousState) {
        if (bp.wireId !== undefined) {
            return this._checkWire(bp, scope, previousState)
        }
        if (bp.componentId !== undefined) {
            return this._checkComponent(bp, scope)
        }
        if (bp.customCondition) {
            return bp.customCondition(scope)
        }
        return false
    }

    _checkWire(bp, scope, previousState) {
        let currentValue = null
        let previousValue = null

        if (scope.allNodes) {
            for (let i = 0; i < scope.allNodes.length; i++) {
                if (i === bp.wireId || scope.allNodes[i].id === bp.wireId) {
                    currentValue = scope.allNodes[i].value

                    if (previousState && previousState.nodes && previousState.nodes[i]) {
                        previousValue = previousState.nodes[i].value
                    }
                    break
                }
            }
        }

        if (currentValue === null) return false

        switch (bp.condition) {
            case 'equals':
                return currentValue === bp.value
            case 'changes':
                return previousValue !== null && previousValue !== currentValue
            case 'risingEdge':
                return previousValue === 0 && currentValue === 1
            case 'fallingEdge':
                return previousValue === 1 && currentValue === 0
            case 'greaterThan':
                return currentValue > bp.value
            case 'lessThan':
                return currentValue < bp.value
            default:
                return false
        }
    }

    _checkComponent(bp, scope) {
        const moduleTypes = [
            'Input', 'Output', 'AndGate', 'OrGate', 'NotGate',
            'XorGate', 'NandGate', 'NorGate', 'XnorGate',
            'Clock', 'Multiplexer', 'Demultiplexer'
        ]

        for (const moduleType of moduleTypes) {
            if (!scope[moduleType]) continue
            for (const component of scope[moduleType]) {
                if (component.id === bp.componentId) {
                    if (bp.condition === 'outputEquals' && component.output) {
                        return component.output.value === bp.value
                    }
                }
            }
        }
        return false
    }

    getAllBreakpoints() {
        return this.breakpoints
    }

    clear() {
        this.breakpoints = []
        this.triggeredBreakpoint = null
    }

    getTriggeredBreakpoint() {
        return this.triggeredBreakpoint
    }

    clearTriggered() {
        this.triggeredBreakpoint = null
    }
}

export const breakpointManager = new BreakpointManager()
