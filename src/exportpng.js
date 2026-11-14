// exportpng.js — menyimpan tampilan ruangan saat ini sebagai gambar PNG.
import { renderer, scene, camera } from './scene.js'
import { room } from './config.js'
import { hideMarker } from './marker.js'

export function exportPng() {
  hideMarker()                    // bingkai putih penanda tidak ikut tergambar
  renderer.render(scene, camera)  // gambar ulang sekarang; toDataURL harus dipanggil tepat setelahnya
  const url = renderer.domElement.toDataURL('image/png')

  // Unduh lewat tautan sementara yang diklik lewat kode
  const link = document.createElement('a')
  link.href = url
  link.download = `kosplanner-${Math.round(room.w * 100)}x${Math.round(room.d * 100)}.png`
  link.click()
}