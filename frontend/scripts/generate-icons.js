const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Helper: Calculate CRC32 for PNG chunks
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};

const crcTable = makeCrcTable();
const crc32 = (buf) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

const createChunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
};

// Generate an RGBA PNG buffer with modern Teal styling and HRMS monogram
function generateHrmsPng(size) {
  const width = size;
  const height = size;

  // Scanline: 1 filter byte (0) + width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const center = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.40;

  // Palette: Dark Teal #006657, Teal Primary #008272, Light Accent #00a894, White #FFFFFF
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Distance from center for rounded badge
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Gradient background from Teal to Deep Teal
        const gradT = (y / height);
        const rBg = Math.round(0 * (1 - gradT) + 0 * gradT);
        const gBg = Math.round(140 * (1 - gradT) + 95 * gradT);
        const bBg = Math.round(125 * (1 - gradT) + 85 * gradT);

        // Check if inside letter "H"
        const xNorm = x / size;
        const yNorm = y / size;

        const inHLeft = xNorm >= 0.28 && xNorm <= 0.38 && yNorm >= 0.26 && yNorm <= 0.74;
        const inHRight = xNorm >= 0.62 && xNorm <= 0.72 && yNorm >= 0.26 && yNorm <= 0.74;
        const inHBar = xNorm >= 0.36 && xNorm <= 0.64 && yNorm >= 0.45 && yNorm <= 0.55;

        // Subtle accent dot above the H bar
        const dotDist = Math.hypot(x - center, y - size * 0.33);
        const inDot = dotDist <= size * 0.055;

        if (inHLeft || inHRight || inHBar || inDot) {
          // Crisp White foreground
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Teal Badge background
          rawData[pixelOffset] = rBg;
          rawData[pixelOffset + 1] = gBg;
          rawData[pixelOffset + 2] = bBg;
          rawData[pixelOffset + 3] = 255;
        }
      } else if (dist <= radius + 1.5) {
        // Anti-aliased border edge
        const alpha = Math.max(0, Math.min(255, Math.round((radius + 1.5 - dist) * 170)));
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 130;
        rawData[pixelOffset + 2] = 114;
        rawData[pixelOffset + 3] = alpha;
      } else {
        // Transparent outside badge
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // No interlace

  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", zlib.deflateSync(rawData, { level: 9 }));
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate Windows .ico file with PNG embedded resources
function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4);

  let currentOffset = 6 + count * 16;
  const dirEntries = [];

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Palette count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size
    entry.writeUInt32LE(currentOffset, 12); // Offset

    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
}

// Generate macOS .icns file with PNG chunks
function createIcns(png512, png256, png128) {
  const chunks = [
    { type: "ic10", buf: png512 }, // 512x512
    { type: "ic09", buf: png512 }, // 512x512
    { type: "ic08", buf: png256 }, // 256x256
    { type: "ic07", buf: png128 }, // 128x128
  ];

  const chunkBuffers = chunks.map(({ type, buf }) => {
    const header = Buffer.alloc(8);
    header.write(type, 0, 4, "ascii");
    header.writeUInt32BE(8 + buf.length, 4);
    return Buffer.concat([header, buf]);
  });

  const totalLength = 8 + chunkBuffers.reduce((acc, c) => acc + c.length, 0);
  const icnsHeader = Buffer.alloc(8);
  icnsHeader.write("icns", 0, 4, "ascii");
  icnsHeader.writeUInt32BE(totalLength, 4);

  return Buffer.concat([icnsHeader, ...chunkBuffers]);
}

function main() {
  const outDir = path.join(__dirname, "../build-resources");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log("Generating HRMS Desktop Application Icons...");
  const png512 = generateHrmsPng(512);
  const png256 = generateHrmsPng(256);
  const png128 = generateHrmsPng(128);
  const png48 = generateHrmsPng(48);
  const png32 = generateHrmsPng(32);
  const png16 = generateHrmsPng(16);

  // 1. icon.png (512x512)
  const pngPath = path.join(outDir, "icon.png");
  fs.writeFileSync(pngPath, png512);
  console.log("✓ Created:", pngPath, `(${png512.length} bytes)`);

  // 2. icon.ico (Multi-size Windows Icon)
  const icoPath = path.join(outDir, "icon.ico");
  const icoBuffer = createIco([
    { size: 256, buffer: png256 },
    { size: 128, buffer: png128 },
    { size: 48, buffer: png48 },
    { size: 32, buffer: png32 },
    { size: 16, buffer: png16 },
  ]);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log("✓ Created:", icoPath, `(${icoBuffer.length} bytes)`);

  // 3. icon.icns (macOS Icon Container)
  const icnsPath = path.join(outDir, "icon.icns");
  const icnsBuffer = createIcns(png512, png256, png128);
  fs.writeFileSync(icnsPath, icnsBuffer);
  console.log("✓ Created:", icnsPath, `(${icnsBuffer.length} bytes)`);
}

main();
