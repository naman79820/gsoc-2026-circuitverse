<template>
  <div v-if="isDebugMode && !embed" class="timeline-bar">
    <span>Timeline: Step {{ curStep }} / {{ total }}</span>
    <input type="range" :min="0" :max="Math.max(0, total - 1)" :value="curStep - 1"
      @input="scrub($event)" :disabled="total === 0" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

let debugModeGet: any, getStateHistory: any, jumpToState: any

const loadFns = async () => {
  try {
    const e = await import('../simulator/src/engine')
    debugModeGet = e.debugModeGet; getStateHistory = e.getStateHistory; jumpToState = e.jumpToState
  } catch (_) {}
}

const isDebugMode = ref(false)
const info = ref<any>({ states: [], currentIndex: -1 })
// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

const curStep = computed(() => info.value.currentIndex + 1)
const total = computed(() => info.value.states.length)

function scrub(e: Event) {
  const idx = parseInt((e.target as HTMLInputElement).value)
  if (jumpToState) { jumpToState(idx); refresh() }
}

function refresh() {
  if (debugModeGet) isDebugMode.value = debugModeGet()
  if (isDebugMode.value && getStateHistory) info.value = getStateHistory()
}

let timer: any = null
onMounted(async () => { await loadFns(); timer = setInterval(refresh, 100) })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.timeline-bar {
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-weight: 600;
}

.timeline-bar input[type="range"] {
  flex: 1;
}
</style>
