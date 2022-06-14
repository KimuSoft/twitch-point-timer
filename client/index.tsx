import { CssBaseline } from "@mui/material"
import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import { Layout } from "./layout"
import { AddRewards } from "./routes/AddRewards"
import { Home } from "./routes/Home"
import { Overlay } from "./routes/Overlay"
import { RewardEdit } from "./routes/RewardEdit"
import { Rewards } from "./routes/Rewards"
import "react-toastify/dist/ReactToastify.min.css"

const root: ReactDOM.Root =
  (window as any).root ?? ReactDOM.createRoot(document.querySelector("#app")!)

;(window as any).root = root

root.render(
  <>
    <ToastContainer />
    <CssBaseline />
    <HashRouter>
      <Routes>
        <Route path="/overlay/:key" element={<Overlay />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/add" element={<AddRewards />} />
          <Route path="/rewards/:id" element={<RewardEdit />} />
        </Route>
      </Routes>
    </HashRouter>
  </>
)

declare const module: any

if (module.hot) {
  module.hot.accept()
}
