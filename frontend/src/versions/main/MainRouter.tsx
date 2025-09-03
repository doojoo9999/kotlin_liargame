import * as React from "react"
import {Route, Routes} from "react-router-dom"
import {ComponentDemoPage} from "./pages/ComponentDemoPage"

export function MainRouter() {
  return (
    <Routes>
      <Route path="/" element={<ComponentDemoPage />} />
      <Route path="/demo" element={<ComponentDemoPage />} />
    </Routes>
  )
}
