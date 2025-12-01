'use client'

import { useState } from 'react'

export default function Logo() {
  const [logoError, setLogoError] = useState(false)

  if (logoError) {
    return (
      <div className="h-32 w-32 mx-auto bg-primary-100 rounded-lg flex items-center justify-center">
        <span className="text-primary-600 font-bold text-xl">AG</span>
      </div>
    )
  }

  return (
    <img 
      src="/MetroMinds.png" 
      alt="AlphaGrid Logo" 
      className="h-32 w-auto mx-auto"
      onError={() => setLogoError(true)}
    />
  )
}

