// scene.js — panggung 3D: renderer, kamera, cahaya.
import * as THREE from 'three'
import { room, COLORS, view, viewSigns } from './config.js'

export const scene = new THREE.Scene()
scene.background = new THREE.Color(COLORS.background)

export const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
document.getElementById('app').appendChild(renderer.domElement)

export const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 100)

// Cahaya
scene.add(new THREE.AmbientLight(0xffffff, 1.3))
const sun = new THREE.DirectionalLight(0xffffff, 1.6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.left = -8
sun.shadow.camera.right = 8
sun.shadow.camera.top = 8
sun.shadow.camera.bottom = -8
sun.shadow.camera.updateProjectionMatrix()
scene.add(sun)
scene.add(sun.target)

// Arahkan kamera dan cahaya ke ruangan. Dipanggil saat ukuran ruangan, sudut, atau jendela berubah.
export function fitCamera() {
  const target = new THREE.Vector3(room.w / 2, 0.8, room.d / 2)
  const aspect = window.innerWidth / window.innerHeight
  const { sx, sz } = viewSigns()
  let viewSize

  if (view.top) {
    // Tampilan atas: kamera lurus di atas lantai, dinding belakang (z = 0) di atas layar
    camera.up.set(0, 0, -1)
    camera.position.set(target.x, 20, target.z)
    camera.lookAt(target.x, 0, target.z)
    viewSize = Math.max(room.d + 1.5, (room.w + 1.5) / aspect)
  } else {
    // Isometrik: kamera di salah satu dari empat sudut
    camera.up.set(0, 1, 0)
    camera.position.set(target.x + sx * 10, target.y + 10, target.z + sz * 10)
    camera.lookAt(target)
    viewSize = Math.max(room.w, room.d) * 2
  }

  camera.left = (-viewSize * aspect) / 2
  camera.right = (viewSize * aspect) / 2
  camera.top = viewSize / 2
  camera.bottom = -viewSize / 2
  camera.updateProjectionMatrix()

  // Cahaya berada di sisi kamera supaya sisi yang terlihat selalu terang
  sun.target.position.set(room.w / 2, 0, room.d / 2)
  sun.position.set(room.w / 2 + sx * 6, 10, room.d / 2 + sz * 4)
}

fitCamera()