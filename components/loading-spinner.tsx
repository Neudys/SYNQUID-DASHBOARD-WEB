'use client'

import { DNA } from 'react-loader-spinner'

export function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex items-center justify-center rounded-2xl bg-background shadow-xl size-[130px]">
        <DNA
          visible
          height={90}
          width={90}
          ariaLabel="loading"
          wrapperStyle={{ filter: 'hue-rotate(148deg) saturate(1.3) brightness(0.95)' }}
        />
      </div>
    </div>
  )
}
