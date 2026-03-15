<template>
  <div v-if="isDebugMode && !embed" class="watch-panel">
    <div class="panel-header">
      <h3>👁️ Watch Panel</h3>
      <button @click="clearAll" class="btn-clear" :disabled="watches.length === 0">
        Clear All
      </button>
    </div>

    <div v-if="watches.length === 0" class="empty-state">
      Click on wires or components to watch their values
    </div>

    <div v-else class="watch-list">
      <div 
        v-for="watch in watches" 
        :key="watch.id"
        class="watch-item"
        :class="{ changed: watch.changed }"
      >
        <div class="watch-name">{{ watch.name }}</div>
        <div class="watch-value">
          <span class="value-decimal">{{ watch.value }}</span>
          <span class="value-binary">(0b{{ toBinary(watch.value) }})</span>
        </div>
        <button @click="removeWatch(watch.id)" class="btn-remove">×</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Engine functions
let debugModeGet: () => boolean
let getStateHistory: () => any

const loadEngineFunctions = async () => {
  try {
    const engine = await import('../simulator/src/engine')
    debugModeGet = engine.debugModeGet
    getStateHistory = engine.getStateHistory
  } catch (error) {
    console.error('Failed to load engine functions:', error)
  }
}

interface Watch {
  id: string
  name: string
  value: number
  previousValue: number
  changed: boolean
  nodeIndex: number
}

const isDebugMode = ref(false)
const watches = ref<Watch[]>([])

// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

function addWatch(item: { id: string, name: string, value: number, nodeIndex: number }) {
  // Check if already watching
  if (watches.value.find(w => w.id === item.id)) return

  watches.value.push({
    id: item.id,
    name: item.name,
    value: item.value,
    previousValue: item.value,
    changed: false,
    nodeIndex: item.nodeIndex
  })
}

function updateWatches() {
  if (!debugModeGet || !getStateHistory) return
  
  isDebugMode.value = debugModeGet()
  
  if (!isDebugMode.value) return

  const history = getStateHistory()
  const currentState = history.states[history.currentIndex]
  
  if (!currentState || !currentState.nodes) return

  watches.value.forEach(watch => {
    const node = currentState.nodes[watch.nodeIndex]
    if (node) {
      const newValue = node.value
      watch.changed = watch.value !== newValue
      watch.previousValue = watch.value
      watch.value = newValue

      // Clear changed indicator after animation
      if (watch.changed) {
        setTimeout(() => {
          watch.changed = false
        }, 500)
      }
    }
  })
}

function removeWatch(id: string) {
  watches.value = watches.value.filter(w => w.id !== id)
}

function clearAll() {
  watches.value = []
}

function toBinary(value: number): string {
  if (value === undefined || value === null) return '?'
  return value.toString(2).padStart(8, '0')
}

let updateInterval: NodeJS.Timeout | null = null

// Expose addWatch function globally so canvas can call it
onMounted(async () => {
  await loadEngineFunctions()
  
  // Make addWatch available globally
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.addToWatchPanel = addWatch
  }

  updateInterval = setInterval(updateWatches, 100)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  
  // Cleanup global function
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete window.addToWatchPanel
  }
})
</script>

<style scoped>
.watch-panel {
  position: fixed;
  right: 20px;
  top: 420px;
  width: 320px;
  max-height: 350px;
  background: white;
  border: 2px solid #17a2b8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px solid #e9ecef;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #17a2b8;
}

.btn-clear {
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.btn-clear:hover:not(:disabled) {
  background: #c82333;
}

.btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  font-size: 13px;
  line-height: 1.6;
}

.watch-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.watch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.3s;
}

.watch-item:hover {
  border-color: #17a2b8;
  box-shadow: 0 2px 4px rgba(23,162,184,0.1);
}

.watch-item.changed {
  background: #fff3cd;
  border-color: #ffc107;
  animation: highlight 0.5s;
}

@keyframes highlight {
  0% { 
    background: #ffc107;
    transform: scale(1.02);
  }
  100% { 
    background: #fff3cd;
    transform: scale(1);
  }
}

.watch-name {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  color: #212529;
  font-family: monospace;
}

.watch-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: monospace;
  font-size: 12px;
}

.value-decimal {
  font-size: 14px;
  font-weight: 700;
  color: #007bff;
}

.value-binary {
  font-size: 10px;
  color: #6c757d;
}

.btn-remove {
  width: 22px;
  height: 22px;
  border: none;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  font-weight: bold;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #c82333;
  transform: scale(1.1);
}
</style>
