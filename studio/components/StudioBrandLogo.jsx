/* eslint-disable react/prop-types */
import React from 'react';

/**
 * Studio 顶栏 Logo：可在 studio/.env 设置 SANITY_STUDIO_LOGO_URL（公开可访问的静态地址）
 * 或替换为本地 static 资源路径（构建后需可访问）
 */
export function StudioBrandLogo() {
  const logoUrl = typeof process !== 'undefined' ? process.env.SANITY_STUDIO_LOGO_URL : '';
  const brand =
    (typeof process !== 'undefined' && process.env.SANITY_STUDIO_BRAND_SHORT) || 'YOZO';

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        style={{ height: 22, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
    );
  }

  return (
    <span
      style={{
        fontWeight: 600,
        fontSize: 15,
        letterSpacing: '0.04em',
      }}
    >
      {brand}
    </span>
  );
}
