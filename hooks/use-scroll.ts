"use client"

import { useState, useEffect, useRef } from "react"

export function useScroll(threshold = 0) {
  const [scrolled, setScrolled] = useState(false)
  // Initialize visible to true so it doesn't flicker on mount
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame for performance (throttling)
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          // 1. Handle 'scrolled' state (adds shadow/styles)
          // Simple threshold check
          setScrolled(currentScrollY > threshold)

          // 2. Handle 'visible' state (hide/show top bar)
          // STABILITY FIX: Minimum delta of 10px to prevent jitter on sensitive touchpads
          // STABILITY FIX: Buffer zone at top (0-20px) where it's always visible
          const scrollDelta = currentScrollY - lastScrollY.current

          if (currentScrollY < 20) {
            // Always visible at the very top
            setVisible(true)
          } else if (Math.abs(scrollDelta) > 10) {
            // Only update if scrolled more than 10px
            if (scrollDelta > 0) {
              // Scrolling DOWN -> Hide
              setVisible(false)
            } else {
              // Scrolling UP -> Show
              setVisible(true)
            }
          }

          lastScrollY.current = currentScrollY
          ticking.current = false
        })

        ticking.current = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return { scrolled, visible }
}
