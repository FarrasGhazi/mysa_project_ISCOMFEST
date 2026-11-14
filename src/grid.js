// grid.js — garis grid berskala di lantai dan label panjang (1 m, 2 m, ...) di tepi.
import * as THREE from 'three'
import { scene } from './scene.js'
import { room, grid, viewSigns } from './config.js'

const Y = 0.003 // sedikit di atas lantai supaya garis tidak "berkedip"
const OPACITY = { minor: 0.2, mid: 0.4, major: 0.75 } // tipis, sedang (50 cm), tebal (1 m)

let group = null

// Teks kecil dijadikan gambar lalu ditempel ke sprite (selalu menghadap kamera)
function makeLabel(text, height) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = 'bold 34px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.strokeText(text, 64, 32)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, 64, 32)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  )
  sprite.scale.set(height * 2, height, 1)
  sprite.renderOrder = 10
  return sprite
}

function clearGrid() {
  if (!group) return
  scene.remove(group)
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose()
    if (o.material) {
      if (o.material.map) o.material.map.dispose()
      o.material.dispose()
    }
  })
  group = null
}

// Bangun ulang grid dari ukuran ruangan dan satuan grid saat ini
export function buildGrid() {
  clearGrid()
  group = new THREE.Group()
  group.visible = grid.visible

  // Hitung dalam cm (bilangan bulat) supaya tidak kena galat desimal
  const widthCm = Math.round(room.w * 100)
  const depthCm = Math.round(room.d * 100)
  const stepCm = Math.round(grid.step * 100)
  const points = { minor: [], mid: [], major: [] }
  const levelOf = (cm) => (cm % 100 === 0 ? 'major' : cm % 50 === 0 ? 'mid' : 'minor')

  for (let cm = stepCm; cm < widthCm; cm += stepCm) {      // garis sejajar sumbu Z
    const x = cm / 100
    points[levelOf(cm)].push(x, Y, 0, x, Y, room.d)
  }
  for (let cm = stepCm; cm < depthCm; cm += stepCm) {      // garis sejajar sumbu X
    const z = cm / 100
    points[levelOf(cm)].push(0, Y, z, room.w, Y, z)
  }

  for (const level of ['minor', 'mid', 'major']) {
    if (points[level].length === 0) continue
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points[level], 3))
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: OPACITY[level], depthWrite: false,
    })
    group.add(new THREE.LineSegments(geometry, material))
  }

  // Label tiap 1 m di dua tepi yang paling dekat dengan kamera
  const { sx, sz } = viewSigns()
  const h = Math.max(room.w, room.d) * 0.07
  const gap = h * 1.2 + room.wallT
  for (let m = 1; m * 100 < widthCm; m++) {
    const label = makeLabel(`${m} m`, h)
    label.position.set(m, 0.02, sz > 0 ? room.d + gap : -gap)
    group.add(label)
  }
  for (let m = 1; m * 100 < depthCm; m++) {
    const label = makeLabel(`${m} m`, h)
    label.position.set(sx > 0 ? room.w + gap : -gap, 0.02, m)
    group.add(label)
  }

  scene.add(group)
}

export function setGridVisible(visible) {
  grid.visible = visible
  if (group) group.visible = visible
}

export function setGridStep(cm) {
  grid.step = cm / 100
  buildGrid()
}