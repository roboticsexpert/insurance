'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React, { useSyncExternalStore } from 'react'

import type { ThemePreference } from '../shared'

import { useTheme } from '..'
import { getServerThemePreference, getThemePreference, subscribeToThemePreference } from '../shared'

export const ThemeSelector: React.FC = () => {
  const { setTheme } = useTheme()

  const value = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreference,
    getServerThemePreference,
  )

  const onThemeChange = (themeToSet: ThemePreference) => {
    setTheme(themeToSet === 'auto' ? null : themeToSet)
  }

  return (
    <Select onValueChange={onThemeChange} value={value}>
      <SelectTrigger aria-label="انتخاب تم" className="w-auto gap-2 border-none bg-transparent">
        <SelectValue placeholder="تم" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">خودکار</SelectItem>
        <SelectItem value="light">روشن</SelectItem>
        <SelectItem value="dark">تیره</SelectItem>
      </SelectContent>
    </Select>
  )
}
