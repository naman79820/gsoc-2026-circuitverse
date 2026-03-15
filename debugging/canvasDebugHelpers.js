/* eslint-disable import/no-cycle */

/**
 * Helper functions for canvas debugging interactions
 * @category debug
 */

/**
 * Find which node/wire is under the mouse cursor
 * @param {number} x - Mouse X coordinate
 * @param {number} y - Mouse Y coordinate
 * @param {Scope} scope - Current circuit scope
 * @returns {Object|null} Found node/wire or null
 */
export function findNodeAtPosition(x, y, scope) {
    if (!scope.allNodes) return null

    const hitRadius = 10 // Pixels

    for (let i = 0; i < scope.allNodes.length; i++) {
        const node = scope.allNodes[i]
        const nodeX = node.absX ? node.absX() : node.x
        const nodeY = node.absY ? node.absY() : node.y

        // Check if mouse is near this node
        const dx = x - nodeX
        const dy = y - nodeY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < hitRadius) {
            return {
                type: 'node',
                node: node,
                nodeIndex: i,
                name: `Node ${i}`,
                value: node.value,
                bitWidth: node.bitWidth
            }
        }
    }

    return null
}

/**
 * Get tooltip data for a node
 * @param {Object} nodeInfo - Node information from findNodeAtPosition
 * @returns {Object} Tooltip data
 */
export function getTooltipData(nodeInfo) {
    if (!nodeInfo) return null

    return {
        title: nodeInfo.name,
        value: nodeInfo.value !== undefined ? nodeInfo.value : '?',
        bitWidth: nodeInfo.bitWidth,
        nodeIndex: nodeInfo.nodeIndex
    }
}

/**
 * Get watch panel data for a node
 * @param {Object} nodeInfo - Node information from findNodeAtPosition
 * @returns {Object} Watch panel data
 */
export function getWatchData(nodeInfo) {
    if (!nodeInfo) return null

    return {
        id: `node-${nodeInfo.nodeIndex}`,
        name: nodeInfo.name,
        value: nodeInfo.value !== undefined ? nodeInfo.value : 0,
        nodeIndex: nodeInfo.nodeIndex
    }
}
