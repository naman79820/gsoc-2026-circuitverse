<template>
  <div v-if="visible && tooltipData" class="circuit-tooltip" :style="{ left: pos.x + 'px', top: pos.y + 'px' }">
    <div class="tt-header">{{ tooltipData.title }}</div>
    <div class="tt-row"><span>Value:</span> <b>{{ tooltipData.value }}</b></div>
    <div class="tt-row"><span>Binary:</span> <b>0b{{ (tooltipData.value ?? 0).toString(2).padStart(8, '0') }}</b></div>
    <div v-if="tooltipData.bitWidth" class="tt-row"><span>Width:</span> <b>{{ tooltipData.bitWidth }}</b></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })
const tooltipData = ref<any>(null)

function show(x: number, y: number, data: any) {
  visible.value = true
  pos.value = { x: x + 15, y: y + 15 }
  tooltipData.value = data
}

function hide() {
  visible.value = false
  tooltipData.value = null
}

defineExpose({ show, hide })
</script>

<style scoped>
.circuit-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 8px 10px;
  border-radius: 6px;
  z-index: 10000;
  pointer-events: none;
  font-size: 12px;
  min-width: 160px;
}

.tt-header {
  font-weight: 700;
  color: #4fc3f7;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.tt-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.tt-row span {
  color: #aaa;
}

.tt-row b {
  font-family: monospace;
}
</style>
