import React, { useState } from 'react'

export default function Logo({ className = 'w-9 h-9' }) {
  const [src, setSrc] = useState('/logo.svg')
  const handleError = () => {
    if (src === '/logo.svg') setSrc('/logo.png')
    else if (src === '/logo.png') setSrc('/logo.webp')
    else if (src === '/logo.webp') setSrc('/logo.jpg')
    else setSrc('/fallback-logo.svg')
  }
  return (
    <img src={src} onError={handleError} alt="Logo" className={`${className} object-contain`} />
  )
}
