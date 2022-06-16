import { Box } from "@mui/system"
import { Reward, User } from "@prisma/client"
import React from "react"
import { useApi } from "../hooks/useApi"
import io from "socket.io-client"
import { useParams } from "react-router-dom"
import {
  formatDuration,
  OverlayData,
  OverlayDataContext,
  useTimerComponent,
} from "../utils"
import { Alert } from "@mui/material"

export const Overlay: React.FC = () => {
  const { key } = useParams<"key">()

  const [rewards, setRewards] = React.useState<Reward[]>([])

  const [disconnected, setDisconnected] = React.useState(false)
  const [connected, setConnected] = React.useState(false)

  React.useEffect(() => {
    const socket = io({ autoConnect: false, query: { overlay: key } })

    socket.on("connect", () => {
      setConnected(true)
      setDisconnected(false)
      console.log(`Connected: ${socket.id}`)
    })

    socket.on("disconnect", () => {
      setDisconnected(true)
      setConnected(false)
      console.log("Disconnected")
    })

    socket.on("updateData", (data: Reward[]) => {
      setRewards(data)
    })

    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  const [reload, setReload] = React.useState(false)

  const [value, setValue] = React.useState<OverlayData[]>([])

  React.useEffect(() => {
    const result: OverlayData[] = []

    const now = Date.now()

    for (const reward of rewards) {
      const endsAt = new Date(reward.endsAt).getTime()

      if (endsAt < now) {
        continue
      }

      const seconds = Math.floor((endsAt - now) / 1000)

      result.push({
        name: reward.name,
        remainingTime: formatDuration(seconds),
        remainingSeconds: seconds,
        reward,
      })
    }

    setValue(result)

    const timeout = setTimeout(() => {
      setReload(!reload)
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [rewards, reload])

  return (
    <OverlayDataContext.Provider value={value}>
      <div style={{ width: "100vw", height: "100vh" }}>
        {disconnected ? (
          <div
            style={{
              background: "#fff",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Disconnected.
          </div>
        ) : !connected ? (
          <div
            style={{
              background: "#fff",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Connecting...
          </div>
        ) : (
          <React.Suspense
            fallback={
              <div
                style={{
                  background: "#fff",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                Loading...
              </div>
            }
          >
            <OverlayContent />
          </React.Suspense>
        )}
      </div>
    </OverlayDataContext.Provider>
  )
}

const OverlayContent: React.FC = () => {
  const { key } = useParams<"key">()
  const user = useApi<User>(`/overlay/${key}`)

  const { Node, error } = useTimerComponent(user.overlayCode)

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        "& pre": { margin: 0 },
      }}
    >
      {error && <Alert severity="error">{error.stack}</Alert>}
      {Node}
    </Box>
  )
}
