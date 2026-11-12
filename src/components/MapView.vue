<template>
  <div ref="el" class="isolate h-full w-full rounded-xl" role="application" aria-label="Peta lokasi"></div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Ikon marker bawaan Leaflet tidak ikut ter-bundle oleh Vite, jadi diarahkan manual.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const props = defineProps({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  zoom: { type: Number, default: 16 },
  // true = klik di peta atau geser marker untuk memilih titik (emit 'pick')
  selectable: Boolean,
})
const emit = defineEmits(['pick'])

const DEFAULT_CENTER = [-7.4705, 110.2183]
const DEFAULT_ZOOM = 13

const el = ref(null)
let map = null
let marker = null

const hasPoint = () => Number.isFinite(props.latitude) && Number.isFinite(props.longitude)

function pick(latlng) {
  const { lat, lng } = latlng.wrap()
  emit('pick', { lat, lng })
}

function createMarker(pos) {
  marker = L.marker(pos, { draggable: props.selectable }).addTo(map)
  if (props.selectable) marker.on('dragend', () => pick(marker.getLatLng()))
}

function render() {
  if (!map) return

  if (!hasPoint()) {
    marker?.remove()
    marker = null
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    return
  }

  const pos = [props.latitude, props.longitude]
  if (!marker) {
    createMarker(pos)
    map.setView(pos, props.zoom)
    return
  }

  // Marker sudah ada: jangan ubah zoom yang sedang dipakai pengguna
  marker.setLatLng(pos)
  if (!map.getBounds().contains(pos)) map.panTo(pos)
}

onMounted(() => {
  map = L.map(el.value)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)

  if (props.selectable) map.on('click', (e) => pick(e.latlng))
  render()
})

watch(() => [props.latitude, props.longitude], render)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  marker = null
})
</script>
