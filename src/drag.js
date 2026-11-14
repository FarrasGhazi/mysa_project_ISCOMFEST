// drag.js — memilih dan menggeser furnitur dengan mouse atau sentuhan (raycasting).
import * as THREE from 'three'
import { renderer, camera } from './scene.js'
import { state } from './state.js'
import { furniture, clampXZ, collides, snapToGrid } from './furniture.js'
import { select } from './ui.js'

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) // lantai imajiner y = 0
const hitPoint = new THREE.Vector3()
const grabOffset = new THREE.Vector3()
let dragging = null

// Ubah posisi kursor jadi sinar dari kamera
function setPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
}

export function initDrag() {
  const canvas = renderer.domElement

  canvas.addEventListener('pointerdown', (event) => {
    setPointer(event)
    const hits = raycaster.intersectObjects(furniture, true)
    if (hits.length === 0) { select(null); return }
    let obj = hits[0].object
    while (obj.parent && !furniture.includes(obj)) obj = obj.parent
    select(obj)
    dragging = obj
    raycaster.ray.intersectPlane(floorPlane, hitPoint)
    grabOffset.set(obj.position.x - hitPoint.x, 0, obj.position.z - hitPoint.z)
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
  })

  canvas.addEventListener('pointermove', (event) => {
    setPointer(event)
    if (!dragging) {
      canvas.style.cursor =
        raycaster.intersectObjects(furniture, true).length > 0 ? 'grab' : 'default'
      return
    }
    if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return
    const s = snapToGrid(dragging, hitPoint.x + grabOffset.x, hitPoint.z + grabOffset.z)
    const c = clampXZ(dragging, s.x, s.z)
    const p = dragging.position
    // coba gerak penuh; kalau tabrakan, coba hanya sumbu X, lalu hanya sumbu Z
    if (!collides(dragging, c.x, c.z)) { p.x = c.x; p.z = c.z }
    else if (!collides(dragging, c.x, p.z)) { p.x = c.x }
    else if (!collides(dragging, p.x, c.z)) { p.z = c.z }
    state.dirty = true
  })

  function endDrag(event) {
    if (!dragging) return
    dragging = null
    canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = 'grab'
  }
  canvas.addEventListener('pointerup', endDrag)
  canvas.addEventListener('pointercancel', endDrag)
}