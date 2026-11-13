// config.js — data tetap dan data bersama. Tidak ada logika di sini.

// Ruangan, satuan meter (1 unit 3D = 1 meter).
// Dibuat sebagai OBJEK supaya isinya bisa diubah nanti (const hanya mengunci nama, bukan isi).
export const room = { w: 3, d: 3, h: 2.5, wallT: 0.12 }

// Pintu di dinding belakang (z = 0). x = posisi pusat pintu.
export const door = { w: 0.9, x: 2.35 }

// Area ayun pintu: persegi di depan pintu yang tidak boleh ditempati furnitur.
export function doorZone() {
  return { x: door.x, z: door.w / 2, hw: door.w / 2, hd: door.w / 2 }
}

export const SNAP = 0.05 // kelipatan posisi saat menggeser furnitur
export const CELL = 0.05 // ukuran sel analisis jalur

export const COLORS = { background: 0x5b6770, floor: 0xb98b66, wall: 0xff7566 }

// Ukuran bawaan tiap furnitur (meter)
export const CATALOG = {
  bed:      { label: 'Kasur',        w: 0.9, d: 2.0, h: 0.5 },
  desk:     { label: 'Meja belajar', w: 1.2, d: 0.6, h: 0.75 },
  wardrobe: { label: 'Lemari',       w: 0.9, d: 0.5, h: 1.8 },
  chair:    { label: 'Kursi',        w: 0.4, d: 0.4, h: 0.9 },
}