<template>
  <div v-if="isDebugMode && !embed" class="sig-ctrl">
    <label>
      Signal Flow
      <input type="checkbox" v-model="on" @change="toggle" />
    </label>
    <div v-if="on" class="speed-row">
      <input type="range" min="50" max="1000" step="50" v-model="speed" @input="updateSpeed" />
      <span>{{ speed }}ms</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

let debugModeGet: any, enableSigViz: any, disableSigViz: any

const loadFns = async () => {
  try {
    const e = await import('../simulator/src/engine')
    debugModeGet = e.debugModeGet; enableSigViz = e.enableSignalVisualization; disableSigViz = e.disableSignalVisualization
  } catch (_) {}
}

const isDebugMode = ref(false)
const on = ref(false)
const speed = ref(300)
// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

function toggle() {
  on.value && enableSigViz ? enableSigViz(speed.value) : disableSigViz?.()
}

function updateSpeed() {
  if (on.value && enableSigViz) { disableSigViz?.(); enableSigViz(speed.value) }
}

let timer: any = null
onMounted(async () => {
  await loadFns()
  timer = setInterval(() => { if (debugModeGet) isDebugMode.value = debugModeGet() }, 100)
})
onUnmounted(() => { if (timer) clearInterval(timer); disableSigViz?.() })
</script>

<style scoped>
.sig-ctrl {
  position: fixed;
  right: 40px;
  bottom: 100px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  font-size: 13px;
}

.sig-ctrl label {
  font-weight: 600;
  display: flex;
  gap: 8px;
  align-items: center;
}

.speed-row {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.speed-row input {
  flex: 1;
}

.speed-row span {
  font-family: monospace;
  font-size: 11px;
}
</style>
