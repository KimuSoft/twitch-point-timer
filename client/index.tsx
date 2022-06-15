import { CssBaseline } from "@mui/material"
import React from "react"
import ReactDOM from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.min.css"

const Home = React.lazy(() =>
  import("./routes/Home").then((x) => ({ default: x.Home }))
)

const Layout = React.lazy(() =>
  import("./layout").then((x) => ({ default: x.Layout }))
)

const AddRewards = React.lazy(() =>
  import("./routes/AddRewards").then((x) => ({ default: x.AddRewards }))
)

const Overlay = React.lazy(() =>
  import("./routes/Overlay").then((x) => ({ default: x.Overlay }))
)

const RewardEdit = React.lazy(() =>
  import("./routes/RewardEdit").then((x) => ({ default: x.RewardEdit }))
)

const Rewards = React.lazy(() =>
  import("./routes/Rewards").then((x) => ({ default: x.Rewards }))
)

const TimeController = React.lazy(() =>
  import("./routes/Controller").then((x) => ({ default: x.TimeController }))
)

const root: ReactDOM.Root =
  (window as any).root ?? ReactDOM.createRoot(document.querySelector("#app")!)

;(window as any).root = root

root.render(
  <React.Suspense fallback="Loading...">
    <ToastContainer />
    <CssBaseline />
    <HashRouter>
      <Routes>
        <Route path="/overlay/:key" element={<Overlay />} />
        <Route path="/controller/:key" element={<TimeController />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/rewards/add" element={<AddRewards />} />
          <Route path="/rewards/:id" element={<RewardEdit />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.Suspense>
)

declare const module: any

if (module.hot) {
  module.hot.accept()
}
