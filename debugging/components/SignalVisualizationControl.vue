<template>
  <div v-if="isDebugMode && !embed" class="signal-viz-control">
    <div class="control-header">
      <span class="control-title">⚡ Signal Flow</span>
      <label class="toggle-switch">
        <input 
          type="checkbox" 
          v-model="isEnabled"
          @change="toggleVisualization"
        />
        <span class="slider"></span>
      </label>
    </div>

    <div v-if="isEnabled" class="control-body">
      <div class="speed-control">
        <label>Animation Speed:</label>
        <input 
          type="range" 
          min="50" 
          max="1000" 
          step="50"
          v-model="animationSpeed"
          @input="updateSpeed"
        />
        <span class="speed-value">{{ animationSpeed }}ms</span>
      </div>

      <div class="status-indicator">
        <div 
          class="pulse-dot" 
          :class="{ active: activeSignals > 0 }"
        ></div>
        <span>{{ activeSignals }} active signals</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

let debugModeGet: () => boolean
let enableSignalVisualization: (speed: number) => void
let disableSignalVisualization: () => void
let getSignalVisualizer: () => any

const loadEngineFunctions = async () => {
  try {
    const engine = await import('../simulator/src/engine')
    debugModeGet = engine.debugModeGet
    enableSignalVisualization = engine.enableSignalVisualization
    disableSignalVisualization = engine.disableSignalVisualization
    getSignalVisualizer = engine.getSignalVisualizer
  } catch (error) {
    console.error('Failed to load engine functions:', error)
  }
}

const isDebugMode = ref(false)
const isEnabled = ref(false)
const animationSpeed = ref(300)
const activeSignals = ref(0)

// @ts-ignore
const embed = typeof window !== 'undefined' ? window.embed || false : false

function toggleVisualization() {
  if (isEnabled.value && enableSignalVisualization) {
    enableSignalVisualization(animationSpeed.value)
  } else if (disableSignalVisualization) {
    disableSignalVisualization()
  }
}

function updateSpeed() {
  if (isEnabled.value && enableSignalVisualization) {
    disableSignalVisualization()
    enableSignalVisualization(animationSpeed.value)
  }
}

function updateStatus() {
  if (debugModeGet) {
    isDebugMode.value = debugModeGet()
  }

  if (isEnabled.value && getSignalVisualizer) {
    const visualizer = getSignalVisualizer()
    activeSignals.value = visualizer.getActiveSignalsCount()
  }
}

let updateInterval: NodeJS.Timeout | null = null

onMounted(async () => {
  await loadEngineFunctions()
  updateInterval = setInterval(updateStatus, 100)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (disableSignalVisualization) {
    disableSignalVisualization()
  }
})
</script>

<style scoped>
.signal-viz-control {
  position: fixed;
  right: 40px;
  bottom: 100px;
  background: white;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 250px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-title {
  font-weight: 700;
  font-size: 14px;
  color: #f57c00;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #ffc107;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.control-body {
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.speed-control {
  margin-bottom: 12px;
}

.speed-control label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.speed-control input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  outline: none;
  border-radius: 2px;
}

.speed-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #ffc107;
  cursor: pointer;
  border-radius: 50%;
}

.speed-value {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #f57c00;
  font-family: monospace;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  background: #ccc;
  border-radius: 50%;
  transition: all 0.3s;
}

.pulse-dot.active {
  background: #ffc107;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.8);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
</style>
