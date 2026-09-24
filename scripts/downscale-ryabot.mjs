/**
 * Makes app-sized copies of the R-YaBot art.
 *
 *   node scripts/downscale-ryabot.mjs [size]
 *
 * The originals are 1254x1254 and about 1MB each. The loader renders at
 * 64-128px, so shipping the originals to the CRM costs ~2MB and shows as a
 * blank loader until they arrive.
 *
 * Alpha is premultiplied before averaging and divided back out afterwards.
 * Averaging straight RGBA blends in the colour of fully transparent pixels,
 * which leaves a dark halo around the cut-out.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const SIZE = Number(process.argv[2] || 256);
const SRC = path.join(process.cwd(), "public", "assets", "images");
const OUT = path.join(process.cwd(), "artifacts", "ryabot-loader", "art");
fs.mkdirSync(OUT, { recursive: true });

const decode = (file) => {
  const b = fs.readFileSync(file);
  const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
  if (b[24] !== 8 || b[25] !== 6) throw new Error("expected 8-bit RGBA: " + file);
  let p = 8;
  const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const type = b.toString("ascii", p + 4, p + 8);
    if (type === "IDAT") idat.push(b.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp + 1;
  const out = Buffer.alloc(w * h * bpp);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * stride];
    for (let x = 0; x < w * bpp; x++) {
      const rv = raw[y * stride + 1 + x];
      const a = x >= bpp ? out[y * w * bpp + x - bpp] : 0;
      const bb = y > 0 ? out[(y - 1) * w * bpp + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * w * bpp + x - bpp] : 0;
      let v;
      if (ft === 0) v = rv;
      else if (ft === 1) v = rv + a;
      else if (ft === 2) v = rv + bb;
      else if (ft === 3) v = rv + ((a + bb) >> 1);
      else {
        const pp = a + bb - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c);
        v = rv + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c);
      }
      out[y * w * bpp + x] = v & 255;
    }
  }
  return { w, h, px: out };
};

const resize = (src, size) => {
  const { w, h, px } = src;
  const out = Buffer.alloc(size * size * 4);
  const sx = w / size, sy = h / size;
  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.min(h, Math.ceil((y + 1) * sy));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.min(w, Math.ceil((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let j = y0; j < y1; j++) {
        for (let i = x0; i < x1; i++) {
          const o = (j * w + i) * 4;
          const al = px[o + 3] / 255;
          r += px[o] * al;
          g += px[o + 1] * al;
          b += px[o + 2] * al;
          a += al;
          n++;
        }
      }
      const o = (y * size + x) * 4;
      const am = a / n;
      if (am <= 0) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      } else {
        out[o] = Math.round(r / n / am);
        out[o + 1] = Math.round(g / n / am);
        out[o + 2] = Math.round(b / n / am);
        out[o + 3] = Math.round(am * 255);
      }
    }
  }
  return out;
};

const crc32 = (() => {
  const t = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const encode = (px, size) => {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    // Filter 1 (Sub) compresses flat cut-out edges better than none.
    raw[y * (stride + 1)] = 1;
    for (let x = 0; x < stride; x++) {
      const cur = px[y * stride + x];
      const left = x >= 4 ? px[y * stride + x - 4] : 0;
      raw[y * (stride + 1) + 1 + x] = (cur - left) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

for (const name of ["ryabot-default", "ryabot-thinking"]) {
  const srcFile = path.join(SRC, `${name}.png`);
  const src = decode(srcFile);
  const png = encode(resize(src, SIZE), SIZE);
  const dest = path.join(OUT, `${name}.png`);
  fs.writeFileSync(dest, png);
  const was = fs.statSync(srcFile).size;
  console.log(
    `${name}.png  ${src.w}x${src.h} ${(was / 1024).toFixed(0)}KB -> ${SIZE}x${SIZE} ${(png.length / 1024).toFixed(0)}KB`,
  );
}
