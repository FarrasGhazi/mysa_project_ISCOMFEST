// marker.js — kotak putih tipis di lantai sebagai tanda furnitur terpilih.
import * as THREE from 'three'
import { scene } from './scene.js'
import { state } from './state.js'

const marker = new THREE.Mesh(
  new THREE.BoxGeometry(1, 0.01, 1),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false })
)
marker.visible = false
scene.add(marker)

export function updateMarker() {
  const sel = state.selected
  if (!sel) { marker.visible = false; return }
  const { w, d } = sel.userData
  marker.visible = true
  marker.position.set(sel.position.x, 0.007, sel.position.z)
  marker.rotation.y = sel.rotation.y
  marker.scale.set(w + 0.1, 1, d + 0.1)
}