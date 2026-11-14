// config.js — data tetap dan data bersama. Tidak ada logika di sini.

// Ruangan, satuan meter (1 unit 3D = 1 meter).
// Dibuat sebagai OBJEK supaya isinya bisa diubah nanti (const hanya mengunci nama, bukan isi).
export const room = { w: 3, d: 3, h: 2.5, wallT: 0.12 }

// Pintu. wall = dinding tempatnya: 'z0' belakang, 'z1' depan, 'x0' kiri, 'x1' kanan
// (sama dengan nama dinding di room.js). pos = posisi pusat pintu sepanjang dinding (meter),
// w = lebar pintu, hinge = engsel di ujung dinding berkoordinat kecil ('low') atau besar ('high'); gagang di ujung lawannya.)
export const door = { wall: 'z0', pos: 2.35, w: 0.9, hinge: 'high' }

// Panjang dinding yang ditempati pintu (dinding z0/z1 sepanjang lebar ruangan, x0/x1 sepanjang panjangnya)
export function doorWallLength() {
  return door.wall === 'z0' || door.wall === 'z1' ? room.w : room.d
}

// Rentang posisi pusat pintu sepanjang dinding (meter): menyisakan 10 cm dari tiap sudut
export function doorRange() {
  const lo = 0.1 + door.w / 2
  return { lo, hi: doorWallLength() - lo }
}

// Juring ayun pintu: seperempat lingkaran (90°) dengan pusat di engsel dan jari-jari = lebar pintu.
// (hx, hz) = titik engsel, (ax, az) = arah dari engsel ke ujung bebas pintu (searah dinding),
// (nx, nz) = arah masuk ke dalam ruangan, r = jari-jari.
export function doorSwing() {
  const alongX = door.wall === 'z0' || door.wall === 'z1'
  const planeAt = { z0: 0, z1: room.d, x0: 0, x1: room.w }[door.wall]
  const inward = door.wall === 'z0' || door.wall === 'x0' ? 1 : -1
  const hingeA = door.hinge === 'low' ? door.pos - door.w / 2 : door.pos + door.w / 2
  const toward = door.hinge === 'low' ? 1 : -1
  if (alongX) return { hx: hingeA, hz: planeAt, ax: toward, az: 0, nx: 0, nz: inward, r: door.w }
  return { hx: planeAt, hz: hingeA, ax: 0, az: toward, nx: inward, nz: 0, r: door.w }
}

export const SNAP = 0.05 // kelipatan posisi saat menggeser furnitur
// Pengaturan grid: step (meter) juga menjadi kelipatan snap saat menggeser furnitur
export const grid = { step: 0.1, visible: true }
export const CELL = 0.05 // ukuran sel analisis jalur

export const COLORS = { background: 0x5b6770, floor: 0xb98b66, wall: 0xff7566 }

// Ukuran bawaan tiap furnitur (meter)
export const CATALOG = {
  bed:      { label: 'Kasur',        w: 0.9, d: 2.0, h: 0.5 },
  desk:     { label: 'Meja belajar', w: 1.2, d: 0.6, h: 0.75 },
  wardrobe: { label: 'Lemari',       w: 0.9, d: 0.5, h: 1.8 },
  chair:    { label: 'Kursi',        w: 0.4, d: 0.4, h: 0.9 },
}

// Sudut kamera: index 0-3 = empat sudut isometrik, top = tampilan atas
export const view = { index: 0, top: false }

const SIGNS = [[1, 1], [-1, 1], [-1, -1], [1, -1]] // sisi kamera terhadap pusat ruangan (x, z)

export function viewSigns() {
  if (view.top) return { sx: 1, sz: 1 }
  const [sx, sz] = SIGNS[view.index]
  return { sx, sz }
}

// Warna cepat untuk furnitur (tanpa merah, karena merah dipakai sebagai penanda "di luar ruangan")
export const PALETTE = [
  0xefe6d2, // krem
  0xffffff, // putih
  0xd9b382, // kayu muda
  0x8b5e3c, // cokelat
  0x3b3b3b, // hitam
  0x6aa7d8, // biru
  0x7fb77e, // hijau
  0xf2c14e, // kuning
]

// Sudut kamera isometrik (derajat). azimut 45 = simetris; di bawah 45 dinding belakang lebih lebar.
export const CAMERA = { azimuth: 22, elevation: 45 }