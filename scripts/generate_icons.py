import zlib
import struct
import math
import os

def create_png(width, height, get_pixel):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0: None
        for x in range(width):
            r, g, b, a = get_pixel(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(chunk(b'IHDR', ihdr))
    compressed = zlib.compress(bytes(raw_data), level=9)
    png.extend(chunk(b'IDAT', compressed))
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

# Render pixel function for app icon
def icon_pixel(x, y, w, h, is_maskable=False):
    # Normalized coords from -1 to 1
    # If maskable, safe zone is central 80%
    scale = 0.75 if is_maskable else 0.90
    nx = (x / (w - 1) - 0.5) * 2 / scale
    ny = (y / (h - 1) - 0.5) * 2 / scale

    # Colors
    c_bg = (26, 28, 41, 255) # #1a1c29
    c_card = (255, 255, 255, 255)
    c_accent = (232, 83, 58, 255) # #e8533a
    c_text = (30, 32, 45, 255)
    c_gray = (180, 175, 168, 255)

    if is_maskable:
        # Full-bleed dark background
        bg_col = (26, 28, 41, 255)
    else:
        # Rounded squircle boundary
        d_sq = (nx**4 + ny**4)**0.25
        if d_sq > 1.05:
            return (0, 0, 0, 0)
        bg_col = c_bg

    # Inner calendar card: nx in [-0.68, 0.68], ny in [-0.62, 0.68]
    cx0, cx1 = -0.68, 0.68
    cy0, cy1 = -0.62, 0.68

    # Rounded card logic
    card_rx = 0.16
    in_card = False
    if cx0 <= nx <= cx1 and cy0 <= ny <= cy1:
        # check corners
        dx = max(0, abs(nx - (cx0 + cx1)/2) - ((cx1 - cx0)/2 - card_rx))
        dy = max(0, abs(ny - (cy0 + cy1)/2) - ((cy1 - cy0)/2 - card_rx))
        if math.hypot(dx, dy) <= card_rx:
            in_card = True

    # Binder rings: nx around -0.35 and +0.35, ny in [-0.76, -0.56]
    for ring_x in [-0.35, 0.35]:
        if abs(nx - ring_x) <= 0.07 and -0.76 <= ny <= -0.54:
            # ring hole / white border
            return (255, 255, 255, 255)

    if in_card:
        # Card header (accent red): ny in [cy0, -0.32]
        if ny <= -0.32:
            return c_accent

        # Task 1 row: check circle at (-0.42, -0.10)
        d_c1 = math.hypot(nx - (-0.42), ny - (-0.10))
        if d_c1 <= 0.08:
            return c_accent
        # checkmark white inside c1
        if d_c1 <= 0.04 and ny >= -0.12:
            return (255, 255, 255, 255)

        # Task 1 text bar: nx in [-0.26, 0.48], ny in [-0.13, -0.07]
        if -0.26 <= nx <= 0.48 and -0.13 <= ny <= -0.07:
            return c_text

        # Task 2 row: check circle at (-0.42, 0.14)
        d_c2 = math.hypot(nx - (-0.42), ny - (0.14))
        if d_c2 <= 0.08:
            return c_accent
        if d_c2 <= 0.04 and ny >= 0.12:
            return (255, 255, 255, 255)

        # Task 2 text bar: nx in [-0.26, 0.38], ny in [0.11, 0.17]
        if -0.26 <= nx <= 0.38 and 0.11 <= ny <= 0.17:
            return c_text

        # Task 3 row: uncheck circle at (-0.42, 0.38)
        d_c3 = math.hypot(nx - (-0.42), ny - (0.38))
        if 0.05 <= d_c3 <= 0.08:
            return c_accent
        if d_c3 < 0.05:
            return (250, 248, 245, 255)

        # Task 3 text bar: nx in [-0.26, 0.45], ny in [0.35, 0.41]
        if -0.26 <= nx <= 0.45 and 0.35 <= ny <= 0.41:
            return c_gray

        return c_card

    return bg_col

os.makedirs('public', exist_ok=True)

# Generate 192x192
print("Generating pwa-192x192.png...")
png_192 = create_png(192, 192, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(png_192)

# Generate 512x512
print("Generating pwa-512x512.png...")
png_512 = create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(png_512)

# Generate maskable 512x512
print("Generating pwa-maskable-512x512.png...")
png_mask = create_png(512, 512, lambda x, y, w, h: icon_pixel(x, y, w, h, True))
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(png_mask)

# Generate apple-touch-icon 180x180
print("Generating apple-touch-icon.png...")
png_apple = create_png(180, 180, lambda x, y, w, h: icon_pixel(x, y, w, h, False))
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(png_apple)

print("Icons successfully created in /public")
