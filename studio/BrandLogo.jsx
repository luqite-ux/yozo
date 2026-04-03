import React from 'react';



/**

 * Studio 左上角 Logo：替换为品牌图或 SVG 即可交付新客户。

 * 也可在 sanity.config 中改用图片 URL（需托管可访问资源）。

 */

export function BrandLogo() {

  return (

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, letterSpacing: '0.02em' }}>

      <span

        style={{

          width: 28,

          height: 28,

          borderRadius: 6,

          background: 'linear-gradient(135deg, #111 0%, #444 100%)',

          flexShrink: 0,

        }}

        aria-hidden

      />

      <span style={{ color: '#101112', fontSize: 15 }}>YOZO</span>

    </div>

  );

}

