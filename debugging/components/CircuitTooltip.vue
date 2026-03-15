<template>
  <div 
    v-if="visible && tooltipData" 
    class="circuit-tooltip"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px' 
    }"
  >
    <div class="tooltip-header">{{ tooltipData.title }}</div>
    <div class="tooltip-content">
      <div class="tooltip-row">
        <span class="label">Value:</span>
        <span class="value">{{ tooltipData.value }}</span>
      </div>
      <div class="tooltip-row">
        <span class="label">Binary:</span>
        <span class="value binary">{{ toBinary(tooltipData.value) }}</span>
      </div>
      <div v-if="tooltipData.bitWidth" class="tooltip-row">
        <span class="label">Bit Width:</span>
        <span class="value">{{ tooltipData.bitWidth }}</span>
      </div>
    </div>
    <div class="tooltip-hint">Click to add to watch panel</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TooltipData {
  title: string
  value: number
  bitWidth?: number
  nodeIndex?: number
}

const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const tooltipData = ref<TooltipData | null>(null)

function show(x: number, y: number, data: TooltipData) {
  visible.value = true
  position.value = { 
    x: x + 15,  // Offset from cursor
    y: y + 15 
  }
  tooltipData.value = data
}

function hide() {
  visible.value = false
  tooltipData.value = null
}

function toBinary(value: number): string {
  if (value === undefined || value === null) return '?'
  return '0b' + value.toString(2).padStart(8, '0')
}

// Expose functions to parent
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.circuit-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 10px 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-width: 180px;
  animation: fadeIn 0.15s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  color: #4fc3f7;
}

.tooltip-content {
  margin-bottom: 8px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.label {
  color: #aaa;
  margin-right: 12px;
}

.value {
  font-weight: 600;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.value.binary {
  color: #4fc3f7;
}

.tooltip-hint {
  font-size: 10px;
  color: #888;
  font-style: italic;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
