#!/usr/bin/env python3
"""PWA 아이콘 생성 스크립트"""

import os
from pathlib import Path

# SVG 아이콘 템플릿
SVG_TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{radius}" fill="url(#bg)"/>
  <text x="50%" y="55%" text-anchor="middle" font-size="{font_size}" fill="#4ade80">📈</text>
</svg>'''

def generate_icons():
    """다양한 크기의 아이콘 생성"""
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]

    script_dir = Path(__file__).parent
    icons_dir = script_dir.parent / "docs" / "icons"
    icons_dir.mkdir(exist_ok=True)

    for size in sizes:
        radius = size // 8
        font_size = size // 2
        svg_content = SVG_TEMPLATE.format(
            size=size,
            radius=radius,
            font_size=font_size
        )

        # SVG 파일로 저장
        svg_path = icons_dir / f"icon-{size}.svg"
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Created: {svg_path}")

    # PNG 변환이 필요하면 별도 처리
    print("\nSVG 아이콘이 생성되었습니다.")
    print("PNG 변환이 필요하면 Inkscape나 ImageMagick을 사용하세요.")

if __name__ == "__main__":
    generate_icons()
