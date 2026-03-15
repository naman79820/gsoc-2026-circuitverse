<template>
  <div v-if="isDebugMode && !embed" class="watch-panel">
    <div class="wp-header">
      <b>Watch Panel</b>
      <button @click="watches = []" :disabled="!watches.length" class="btn-sm">Clear</button>
    </div>
    <div v-if="!watches.length" class="wp-empty">Click on nodes to watch values</div>
    <div v-for="w in watches" :key="w.id" class="wp-item" :class="{ flash: w.changed }">
      <span class="wp-name">{{ w.name }}</span>
      <span class="wp-val">{{ w.value }}</span>
      <button @click="watches = watches.filter(x => x.id !== w.id)" class="btn-x">&times;</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

let debugModeGet: any, getStateHistory: any

const loadFns = async () => {
  try {
    const e = await import('../simulator/src/engine')
    debugModeGet = e.debugModeGet; getStateHistory = e.getStateHistory
  } catch (_) {}
}

const isDebugMode = ref(false)
const watches = ref<any[]>([])
// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

function addWatch(item: any) {
  if (watches.value.find(w => w.id === item.id)) return
  watches.value.push({ ...item, previousValue: item.value, changed: false })
}

function tick() {
  if (debugModeGet) isDebugMode.value = debugModeGet()
  if (!isDebugMode.value || !getStateHistory) return
  const h = getStateHistory()
  const cur = h.states[h.currentIndex]
  if (!cur?.nodes) return
  watches.value.forEach(w => {
    const n = cur.nodes[w.nodeIndex]
    if (!n) return
    w.changed = w.value !== n.value
    w.value = n.value
    if (w.changed) setTimeout(() => { w.changed = false }, 400)
  })
}

let timer: any = null
onMounted(async () => {
  await loadFns()
  if (typeof window !== 'undefined') (window as any).addToWatchPanel = addWatch
  timer = setInterval(tick, 100)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (typeof window !== 'undefined') delete (window as any).addToWatchPanel
})
</script>

<style scoped>
.watch-panel {
  position: fixed;
  right: 20px;
  top: 420px;
  width: 280px;
  background: #fff;
  border: 1px solid #17a2b8;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 13px;
}

.wp-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
}

.wp-empty {
  padding: 20px;
  text-align: center;
  color: #999;
}

.wp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.wp-item.flash {
  background: #fff3cd;
}

.wp-name {
  flex: 1;
  font-family: monospace;
}

.wp-val {
  font-weight: 700;
  color: #007bff;
  font-family: monospace;
}

.btn-sm {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  background: #fff;
}

.btn-x {
  border: none;
  background: #dc3545;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
</style>
