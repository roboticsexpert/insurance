import React from 'react'

import { toPersianDigits } from '@/lib/fa'

export const PageRange: React.FC<{
  className?: string
  collection?: 'posts'
  currentPage?: number
  limit?: number
  totalDocs?: number
}> = (props) => {
  const { className, currentPage, limit, totalDocs } = props

  let indexStart = (currentPage ? currentPage - 1 : 1) * (limit || 1) + 1
  if (totalDocs && indexStart > totalDocs) indexStart = 0

  let indexEnd = (currentPage || 1) * (limit || 1)
  if (totalDocs && indexEnd > totalDocs) indexEnd = totalDocs

  if (typeof totalDocs === 'undefined' || totalDocs === 0) {
    return (
      <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>چیزی پیدا نشد.</div>
    )
  }

  const range =
    indexStart > 0
      ? `${toPersianDigits(indexStart)} تا ${toPersianDigits(indexEnd)}`
      : toPersianDigits(indexEnd)

  return (
    <div className={[className, 'font-semibold'].filter(Boolean).join(' ')}>
      {`نمایش ${range} از ${toPersianDigits(totalDocs)} مقاله`}
    </div>
  )
}
