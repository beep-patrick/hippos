#!/usr/bin/env python3
"""
Convert a black/white maze image directly to a .numbers file.
  Black pixels → white background (bank/shoreline wall)
  White pixels → blue background (water path)

Usage: python3 tools/maze_to_numbers.py <image_path> <output.numbers> [--scale N]

--scale N: pixels per maze cell (default: 1)
"""

import sys
from PIL import Image
from numbers_parser import Document, Style, RGB

BLUE = RGB(100, 160, 255)
WHITE = RGB(255, 255, 255)

blue_style = Style(bg_color=BLUE)
white_style = Style(bg_color=WHITE)


def maze_to_numbers(image_path, output_path, cell_size=1, threshold=128):
    img = Image.open(image_path).convert("L")
    width, height = img.size
    pixels = img.load()

    num_cols = width // cell_size
    num_rows = height // cell_size

    doc = Document(num_rows=num_rows, num_cols=num_cols)
    table = doc.sheets[0].tables[0]

    cell_px = 14
    for c in range(num_cols):
        table.col_width(c, cell_px)
    for r in range(num_rows):
        table.row_height(r, cell_px)

    for row in range(num_rows):
        for col in range(num_cols):
            px = col * cell_size + cell_size // 2
            py = row * cell_size + cell_size // 2
            is_wall = pixels[px, py] < threshold
            table.write(row, col, "", style=white_style if is_wall else blue_style)

    doc.save(output_path)
    print(f"Saved {num_cols}×{num_rows} maze → {output_path}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)

    image_path = args[0]
    output_path = args[1]
    cell_size = 1

    i = 2
    while i < len(args):
        if args[i] == "--scale" and i + 1 < len(args):
            cell_size = int(args[i + 1])
            i += 2
        else:
            i += 1

    maze_to_numbers(image_path, output_path, cell_size)
