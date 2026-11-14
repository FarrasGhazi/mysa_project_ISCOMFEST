// room.js — membangun lantai, empat dinding, dan pintu dari ukuran di config.js.
import * as THREE from 'three'
import { scene, fitCamera } from './scene.js'
import { room, door, COLORS, view, viewSigns } from './config.js'
import { buildGrid } from './grid.js'

let parts = []     // semua kotak penyusun ruangan, disimpan supaya bisa dibuang saat dibangun ulang
let walls = {}     // empat dinding: x0 (kiri), x1 (kanan), z0 (belakang, ada pintu), z1 (depan)
let doorParts = [] // daun pintu dan gagangnya

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
  return mesh
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
  addBox(w, 0.2, d, COLORS.floor, w / 2, -0.1, d / 2) // lantai

  // Dinding sumbu Z lebih panjang supaya sudut pojoknya tertutup di keempat sudut kamera
  walls = {
    z0: addBox(w + 2 * wallT, h, wallT, COLORS.wall, w / 2, h / 2, -wallT / 2),
    z1: addBox(w + 2 * wallT, h, wallT, COLORS.wall, w / 2, h / 2, d + wallT / 2),
    x0: addBox(wallT, h, d, COLORS.wall, -wallT / 2, h / 2, d / 2),
    x1: addBox(wallT, h, d, COLORS.wall, w + wallT / 2, h / 2, d / 2),
  }
  for (const wall of Object.values(walls)) wall.castShadow = false // dinding tidak membuat bayangan

  doorParts = [
    addBox(door.w, 2.0, 0.04, 0xf4efe6, door.x, 1.0, 0.02),                    // daun pintu
    addBox(0.06, 0.06, 0.06, 0xd9a441, door.x - door.w / 2 + 0.13, 1.0, 0.07), // gagang
  ]

  applyWallVisibility()
}

// Sembunyikan dua dinding yang menghadap kamera. Di tampilan atas semua dinding tampil.
export function applyWallVisibility() {
  const { sx, sz } = viewSigns()
  walls.x0.visible = view.top || sx > 0
  walls.x1.visible = view.top || sx < 0
  walls.z0.visible = view.top || sz > 0
  walls.z1.visible = view.top || sz < 0
  for (const m of doorParts) m.visible = walls.z0.visible // pintu menempel di dinding z0
}

// Ubah ukuran ruangan (meter). Pintu digeser bila perlu supaya tetap di dinding.
export function setRoomSize(w, d) {
  room.w = w
  room.d = d
  const margin = 0.1 + door.w / 2
  door.x = Math.min(Math.max(door.x, margin), w - margin)
  buildRoom()
  buildGrid()
  fitCamera()
}