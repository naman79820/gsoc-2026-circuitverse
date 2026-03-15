/* eslint-disable import/no-cycle */

export function findNodeAtPosition(x, y, scope) {
    if (!scope.allNodes) return null
    for (let i = 0; i < scope.allNodes.length; i++) {
        const node = scope.allNodes[i]
        const nx = node.absX ? node.absX() : node.x
        const ny = node.absY ? node.absY() : node.y
        if (Math.hypot(x - nx, y - ny) < 10) {
            return { type: 'node', node, nodeIndex: i, name: `Node ${i}`, value: node.value, bitWidth: node.bitWidth }
        }
    }
    return null
}

export function getTooltipData(info) {
    if (!info) return null
    return { title: info.name, value: info.value ?? '?', bitWidth: info.bitWidth, nodeIndex: info.nodeIndex }
}

export function getWatchData(info) {
    if (!info) return null
    return { id: `node-${info.nodeIndex}`, name: info.name, value: info.value ?? 0, nodeIndex: info.nodeIndex }
}
