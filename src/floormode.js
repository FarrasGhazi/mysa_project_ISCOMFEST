// floormode.js — mode lantai: hijau = kosong, merah = tertutup furnitur, biru = area ayun pintu.
import * as THREE from 'three'
import { scene } from './scene.js'
import { room, doorZone } from './config.js'
import { furniture, halfSize } from './furniture.js'

const PX = 100 // resolusi gambar lantai: 1 piksel = 1 cm

let floor = null      // { pw, ph, ctx, tex, mesh } — bidang hijau/biru di lantai
let visible = false   // nonaktif saat halaman dibuka
let hideFurniture = false // true = badan furnitur disembunyikan, hanya warna yang tampil

// Bidang merah: satu persegi per furnitur, digambar tanpa uji kedalaman supaya tidak tertutup furniturnya
const redGroup = new THREE.Group()
redGroup.visible = false
scene.add(redGroup)
const redMaterial = new THREE.MeshBasicMaterial({
  color: 0xe64638, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false,
})

// Buat bidang lantai baru kalau ukuran ruangan berubah
function ensureFloor() {
  const pw = Math.round(room.w * PX)
  const ph = Math.round(room.d * PX)
  if (floor && floor.pw === pw && floor.ph === ph) return floor

  if (floor) {
    scene.remove(floor.mesh)
    floor.mesh.geometry.dispose()
    floor.mesh.material.dispose()
    floor.tex.dispose()
  }
  const canvas = document.createElement('canvas')
  canvas.width = pw
  canvas.height = ph
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.colorSpace = THREE.SRGBColorSpace

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(room.w, room.d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(room.w / 2, 0.002, room.d / 2)
  mesh.visible = visible
  scene.add(mesh)

  floor = { pw, ph, ctx: canvas.getContext('2d'), tex, mesh }
  return floor
}

function clearRed() {
  while (redGroup.children.length > 0) {
    const m = redGroup.children[0]
    redGroup.remove(m)
    m.geometry.dispose()
  }
}

// Sembunyikan badan furnitur hanya jika mode lantai nyala dan opsinya dicentang
function applyFurnitureVisibility() {
  const hide = visible && hideFurniture
  for (const item of furniture) item.visible = !hide
}

// Gambar ulang mode lantai. Dipanggil saat tata letak berubah.
export function refreshFloorMode() {
  if (!visible) return
  applyFurnitureVisibility() // furnitur yang baru ditambahkan ikut tersembunyi
  const f = ensureFloor()
  const { ctx } = f
  ctx.clearRect(0, 0, f.pw, f.ph)

  // 1. seluruh lantai hijau
  ctx.fillStyle = 'rgba(70, 200, 110, 0.5)'
  ctx.fillRect(0, 0, f.pw, f.ph)

  // 2. area ayun pintu biru (sumbu Y gambar = sumbu Z ruangan)
  const zone = doorZone()
  ctx.fillStyle = 'rgba(90, 150, 255, 0.6)'
  ctx.fillRect((zone.x - zone.hw) * PX, (zone.z - zone.hd) * PX, zone.hw * 2 * PX, zone.hd * 2 * PX)

  // 3. jejak furnitur: kosongkan hijaunya, lalu tempel bidang merah
  clearRed()
  for (const item of furniture) {
    const { hw, hd } = halfSize(item)
    const { x, z } = item.position
    ctx.clearRect((x - hw) * PX, (z - hd) * PX, hw * 2 * PX, hd * 2 * PX)

    const red = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, hd * 2), redMaterial)
    red.rotation.x = -Math.PI / 2
    red.position.set(x, 0.004, z)
    red.renderOrder = 5
    redGroup.add(red)
  }
  f.tex.needsUpdate = true
}

export function setFloorModeVisible(value) {
  visible = value
  redGroup.visible = value
  if (floor) floor.mesh.visible = value
  applyFurnitureVisibility() // mode dimatikan: furnitur tampil kembali
  if (value) refreshFloorMode()
}

export function setHideFurniture(value) {
  hideFurniture = value
  applyFurnitureVisibility()
}