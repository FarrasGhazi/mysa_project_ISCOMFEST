// main.js — penyambung. Tidak ada logika di sini, hanya memanggil modul lain.
import './style.css'
import { renderer, scene, camera } from './scene.js'
import { buildRoom } from './room.js'
import { initUI, refreshAnalysis } from './ui.js'
import { initDrag } from './drag.js'
import { updateMarker } from './marker.js'
import { state } from './state.js'

buildRoom() // bangun ruangan (awalnya kosong, tanpa furnitur)
initUI()    // sambungkan tombol dan kolom input
initDrag()  // sambungkan mouse

// Loop gambar: jalan ~60 kali per detik
function animate() {
  requestAnimationFrame(animate)
  if (state.dirty) { refreshAnalysis(); state.dirty = false }
  updateMarker()
  renderer.render(scene, camera)
}
animate()