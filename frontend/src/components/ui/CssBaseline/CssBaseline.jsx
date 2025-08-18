import React from 'react'
import './CssBaseline.global.css'

// CssBaseline component
export const CssBaseline = ({ children }) => {
  return (
    <div className="app-root">
      {children}
    </div>
  )
}

CssBaseline.displayName = 'CssBaseline'

export default CssBaseline