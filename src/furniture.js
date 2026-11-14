// furniture.js — aturan furnitur: bentuk, tambah/hapus, batas dinding, tabrakan.
import * as THREE from 'three'
import { scene } from './scene.js'
import { room, SNAP, CATALOG, doorZone, grid } from './config.js'
import { state } from './state.js'

export const furniture = [] // semua furnitur yang ada di ruangan

// Resep tiap furnitur: daftar kotak (ukuran, posisi relatif ke pusat, warna)
function getParts(type, w, d, h) {
  if (type === 'bed') {
    const fh = h * 0.5
    const mh = h * 0.5
    return [
      { w, h: fh, d, x: 0, y: fh / 2, z: 0, color: 0x6b4a32 },
      { w: w - 0.06, h: mh, d: d - 0.06, x: 0, y: fh + mh / 2, z: 0, color: 0xf2ead8 },
      { w: Math.max(w - 0.3, 0.2), h: 0.1, d: 0.35, x: 0, y: fh + mh + 0.05,
        z: -d / 2 + 0.3, color: 0xffffff },
    ]
  }
  if (type === 'desk') {
    const t = 0.04, leg = 0.05, lh = h - t
    const ix = w / 2 - leg / 2 - 0.02
    const iz = d / 2 - leg / 2 - 0.02
    const parts = [{ w, h: t, d, x: 0, y: h - t / 2, z: 0, color: 0xd9b382 }]
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        parts.push({ w: leg, h: lh, d: leg, x: sx * ix, y: lh / 2, z: sz * iz, color: 0x5a4030 })
      }
    }
    return parts
  }
  if (type === 'wardrobe') {
    return [
      { w, h, d, x: 0, y: h / 2, z: 0, color: 0xefe6d2 },
      { w: 0.02, h: h * 0.92, d: 0.01, x: 0, y: h / 2, z: d / 2 + 0.005, color: 0x8a7a62 },
    ]
  }
  // kursi
  const t = 0.05, seatY = h * 0.5, leg = 0.04, lh = seatY - t
  const ix = w / 2 - leg / 2
  const iz = d / 2 - leg / 2
  const parts = [
    { w, h: t, d, x: 0, y: seatY - t / 2, z: 0, color: 0xc9a06c },
    { w, h: h - seatY, d: 0.05, x: 0, y: seatY + (h - seatY) / 2, z: -d / 2 + 0.025, color: 0xc9a06c },
  ]
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      parts.push({ w: leg, h: lh, d: leg, x: sx * ix, y: lh / 2, z: sz * iz, color: 0x5a4030 })
    }
  }
  return parts
}

// Setengah lebar dan setengah dalam jejak furnitur di lantai (memperhitungkan putaran)
export function halfSize(obj) {
  const { w, d } = obj.userData
  const turned = Math.abs(Math.round(obj.rotation.y / (Math.PI / 2))) % 2 === 1
  return turned ? { hw: d / 2, hd: w / 2 } : { hw: w / 2, hd: d / 2 }
}

// Batasi posisi (x, z) agar furnitur tetap di dalam dinding
export function clampXZ(obj, x, z) {
  const { hw, hd } = halfSize(obj)
  return {
    x: Math.min(Math.max(x, hw), room.w - hw),
    z: Math.min(Math.max(z, hd), room.d - hd),
  }
}

// Apakah obj di posisi (x, z) bertabrakan dengan furnitur lain atau area pintu?
export function collides(obj, x, z) {
  const { hw, hd } = halfSize(obj)
  const EPS = 0.001
  const overlap = (r) =>
    Math.abs(x - r.x) < hw + r.hw - EPS && Math.abs(z - r.z) < hd + r.hd - EPS
  if (overlap(doorZone())) return true
  for (const other of furniture) {
    if (other === obj) continue
    const s = halfSize(other)
    if (overlap({ x: other.position.x, z: other.position.z, hw: s.hw, hd: s.hd })) return true
  }
  return false
}

// Cari tempat kosong terdekat dari tengah ruangan
function findFreeSpot(obj) {
  const { hw, hd } = halfSize(obj)
  let best = null
  let bestDist = Infinity
  for (let x = hw; x <= room.w - hw + 1e-6; x += SNAP) {
    for (let z = hd; z <= room.d - hd + 1e-6; z += SNAP) {
      if (collides(obj, x, z)) continue
      const dist = Math.hypot(x - room.w / 2, z - room.d / 2)
      if (dist < bestDist) { bestDist = dist; best = { x, z } }
    }
  }
  return best
}

function disposeChildren(group) {
  for (const child of [...group.children]) {
    group.remove(child)
    child.geometry.dispose()
    child.material.dispose()
  }
}

// Bangun ulang kotak-kotak furnitur dari ukuran di userData
export function rebuild(group) {
  const { type, w, d, h } = group.userData
  disposeChildren(group)
  for (const p of getParts(type, w, d, h)) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(p.w, p.h, p.d),
      new THREE.MeshStandardMaterial({ color: p.color })
    )
    mesh.position.set(p.x, p.y, p.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
}

// Mengembalikan furnitur baru, atau null kalau tidak ada tempat kosong
export function addFurniture(type, at) {
  const def = CATALOG[type]
  const group = new THREE.Group()
  group.userData = { type, w: def.w, d: def.d, h: def.h }
  rebuild(group)

  let spot = null
  if (at) {
    const c = clampXZ(group, at.x, at.z)
    if (!collides(group, c.x, c.z)) spot = c
  }
  if (!spot) spot = findFreeSpot(group)
  if (!spot) {
    disposeChildren(group)
    return null
  }

  group.position.set(spot.x, 0, spot.z)
  scene.add(group)
  furniture.push(group)
  state.dirty = true
  return group
}

export function removeFurniture(group) {
  scene.remove(group)
  disposeChildren(group)
  furniture.splice(furniture.indexOf(group), 1)
  state.dirty = true
}

// Apakah furnitur melewati dinding pada ruangan berukuran (w, d)? Bagian yang keluar sedikit pun dihitung.
export function isOutside(obj, w = room.w, d = room.d) {
  const { hw, hd } = halfSize(obj)
  const EPS = 0.001
  const { x, z } = obj.position
  return x - hw < -EPS || x + hw > w + EPS || z - hd < -EPS || z + hd > d + EPS
}

// Berapa furnitur yang BARU akan keluar jika ruangan diubah ke (w, d)?
export function countNewlyOutside(w, d) {
  return furniture.filter((f) => !isOutside(f) && isOutside(f, w, d)).length
}

// Beri warna merah pada furnitur yang berada di luar ruangan (dipanggil tiap tata letak berubah)
export function refreshOutside() {
  for (const f of furniture) {
    const out = isOutside(f)
    for (const mesh of f.children) {
      mesh.material.emissive.set(out ? 0xff2020 : 0x000000)
      mesh.material.emissiveIntensity = out ? 0.8 : 1
    }
  }
}

// Tempelkan sisi kiri-atas furnitur ke garis grid terdekat. (x, z) = posisi pusat yang diinginkan.
export function snapToGrid(obj, x, z) {
  const { hw, hd } = halfSize(obj)
  const s = grid.step
  return {
    x: Math.round((x - hw) / s) * s + hw,
    z: Math.round((z - hd) / s) * s + hd,
  }
}