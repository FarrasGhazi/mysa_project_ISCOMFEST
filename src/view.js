// view.js — mengatur sudut kamera: empat sudut isometrik dan tampilan atas.
import { view } from './config.js'
import { fitCamera } from './scene.js'
import { applyWallVisibility } from './room.js'
import { buildGrid } from './grid.js'

function refreshView() {
  fitCamera()           // pindahkan kamera dan cahaya
  applyWallVisibility() // sembunyikan dinding yang menghadap kamera
  buildGrid()           // label panjang pindah ke tepi yang dekat dengan kamera
}

// step = +1 atau -1 (putar searah atau berlawanan)
export function rotateView(step) {
  view.index = (view.index + step + 4) % 4
  refreshView()
}

export function setTopView(value) {
  view.top = value
  refreshView()
}