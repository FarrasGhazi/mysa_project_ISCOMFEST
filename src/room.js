// room.js — membangun lantai, dinding, dan pintu dari ukuran di config.js.
import * as THREE from 'three'
import { scene } from './scene.js'
import { room, door, COLORS } from './config.js'

let parts = [] // semua kotak penyusun ruangan, disimpan supaya bisa dibuang saat dibangun ulang

function addBox(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color })
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  parts.push(mesh)
}

export function buildRoom() {
  // buang yang lama
  for (const m of parts) {
    scene.remove(m)
    m.geometry.dispose()
    m.material.dispose()
  }
  parts = []

  const { w, d, h, wallT } = room
  addBox(w, 0.2, d, COLORS.floor, w / 2, -0.1, d / 2)                            // lantai
  addBox(w + wallT, h, wallT, COLORS.wall, (w - wallT) / 2, h / 2, -wallT / 2)   // dinding belakang
  addBox(wallT, h, d, COLORS.wall, -wallT / 2, h / 2, d / 2)                     // dinding kiri
  addBox(door.w, 2.0, 0.04, 0xf4efe6, door.x, 1.0, 0.02)                         // daun pintu
  addBox(0.06, 0.06, 0.06, 0xd9a441, door.x - door.w / 2 + 0.13, 1.0, 0.07)      // gagang
}