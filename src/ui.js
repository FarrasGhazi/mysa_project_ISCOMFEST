// ui.js — panel HTML: tombol, kolom input, dan tampilan hasil analisis.
import { CATALOG, room } from './config.js'
import { state } from './state.js'
import { addFurniture, removeFurniture, rebuild, clampXZ, collides, countNewlyOutside } from './furniture.js'
import { analyze, setHeatVisible } from './analysis.js'
import { setRoomSize } from './room.js'
import { setGridStep, setGridVisible } from "./grid.js";
import { setFloorModeVisible, setHideFurniture } from "./floormode.js";

// ---------- Cari elemen HTML (ID harus sama persis dengan di index.html) ----------
const editBox = document.getElementById('edit')
const selName = document.getElementById('sel-name')
const inW = document.getElementById('in-w')
const inD = document.getElementById('in-d')
const inH = document.getElementById('in-h')
const inWalk = document.getElementById('in-walk')
const chkHeat = document.getElementById('chk-heat')
const verdictEl = document.getElementById('verdict')
const scoreEl = document.getElementById('score')
const notesEl = document.getElementById('notes')
const toastEl = document.getElementById('toast')

// ---------- Pesan singkat di bawah layar ----------
let toastTimer
export function toast(message) {
  toastEl.textContent = message
  toastEl.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200)
}

// ---------- Pilih furnitur dan isi panel edit ----------
export function select(obj) {
  state.selected = obj
  if (!obj) { editBox.hidden = true; return }
  const { type, w, d, h } = obj.userData
  editBox.hidden = false
  selName.textContent = CATALOG[type].label
  inW.value = Math.round(w * 100)
  inD.value = Math.round(d * 100)
  inH.value = Math.round(h * 100)
}

function readSize(input, min, max, fallback) {
  const cm = parseFloat(input.value)
  if (Number.isNaN(cm)) return fallback
  return Math.min(Math.max(cm, min), max) / 100
}

function applySize() {
  const sel = state.selected
  if (!sel) return
  const u = sel.userData
  const oldSize = { ...u }
  const oldPos = sel.position.clone()

  u.w = readSize(inW, 30, 300, u.w)
  u.d = readSize(inD, 30, 300, u.d)
  u.h = readSize(inH, 10, 300, u.h)
  rebuild(sel)
  const c = clampXZ(sel, sel.position.x, sel.position.z)
  sel.position.x = c.x
  sel.position.z = c.z

  if (collides(sel, c.x, c.z)) {
    Object.assign(u, oldSize) // batalkan: ukuran baru bertabrakan
    rebuild(sel)
    sel.position.copy(oldPos)
    toast('Ukuran baru bertabrakan, dibatalkan')
  }
  select(sel)
  state.dirty = true
}

// ---------- Ukuran ruangan ----------
const inRoomW = document.getElementById('room-w')
const inRoomD = document.getElementById('room-d')

function syncRoomInputs() {
  inRoomW.value = Math.round(room.w * 100)
  inRoomD.value = Math.round(room.d * 100)
}

// Baca kolom (cm), batasi 150-600, bulatkan ke 5 cm, ubah ke meter
function readRoomCm(input) {
  const cm = parseFloat(input.value)
  if (Number.isNaN(cm)) return null
  return (Math.round(Math.min(Math.max(cm, 150), 600) / 5) * 5) / 100
}

function applyRoomSize() {
  const w = readRoomCm(inRoomW)
  const d = readRoomCm(inRoomD)
  if (w === null || d === null) {
    toast('Isi lebar dan panjang ruangan dengan angka')
    syncRoomInputs()
    return
  }
  const count = countNewlyOutside(w, d)
  if (count > 0) {
    const ok = confirm(`${count} furnitur akan berada di luar ruangan dan ditandai merah. Lanjutkan?`)
    if (!ok) { syncRoomInputs(); return }
  }
  setRoomSize(w, d)
  syncRoomInputs()
  state.dirty = true
}

// ---------- Tampilkan hasil analisis di panel ----------
export function refreshAnalysis() {
  const result = analyze(parseFloat(inWalk.value))
  verdictEl.className = `badge ${result.status}`
  verdictEl.textContent = result.text
  scoreEl.textContent = `Skor kelegaan: ${result.score}%`
  notesEl.innerHTML = result.notes.map((n) => `<li>${n}</li>`).join('')
}

// ---------- Pasang semua event (dijalankan sekali saat halaman dibuka) ----------
export function initUI() {
  document.getElementById('btn-room').addEventListener('click', applyRoomSize)
  syncRoomInputs()
  const selGrid = document.getElementById('sel-grid')
  const chkGrid = document.getElementById('chk-grid')
  selGrid.addEventListener('change', () => setGridStep(parseInt(selGrid.value, 10)))
  chkGrid.addEventListener('change', () => setGridVisible(chkGrid.checked))
  const chkFloor = document.getElementById('chk-floor')
  const chkHide = document.getElementById('chk-hide')
  chkFloor.addEventListener('change', () => {
    chkHide.disabled = !chkFloor.checked // opsi sembunyikan hanya aktif saat mode lantai nyala
    setFloorModeVisible(chkFloor.checked)
  })
  chkHide.addEventListener('change', () => setHideFurniture(chkHide.checked))
  // sinkronkan dengan kotak centang saat halaman dibuka (browser kadang mengingat centangnya)
  chkHide.disabled = !chkFloor.checked
  setHideFurniture(chkHide.checked)
  setFloorModeVisible(chkFloor.checked)
  
  for (const input of [inW, inD, inH]) input.addEventListener('change', applySize)

  document.getElementById('btn-rotate').addEventListener('click', () => {
    const sel = state.selected
    if (!sel) return
    sel.rotation.y += Math.PI / 2
    const c = clampXZ(sel, sel.position.x, sel.position.z)
    if (collides(sel, c.x, c.z)) {
      sel.rotation.y -= Math.PI / 2
      toast('Tidak muat kalau diputar di sini')
      return
    }
    sel.position.x = c.x
    sel.position.z = c.z
    state.dirty = true
  })

  document.getElementById('btn-delete').addEventListener('click', () => {
    if (!state.selected) return
    removeFurniture(state.selected)
    select(null)
  })

  document.querySelectorAll('[data-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = addFurniture(btn.dataset.type)
      if (group) select(group)
      else toast('Ruangan penuh, tidak ada tempat kosong')
    })
  })

  inWalk.addEventListener('change', () => { state.dirty = true })
  chkHeat.addEventListener('change', () => setHeatVisible(chkHeat.checked))
  setHeatVisible(chkHeat.checked) // awal: sesuai kotak centang (kosong = nonaktif)
}