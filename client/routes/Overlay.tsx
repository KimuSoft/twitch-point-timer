import { Box } from "@mui/system"
import { Reward, User } from "@prisma/client"
import React from "react"
import { LiveError, LivePreview, LiveProvider } from "react-live"
import { useApi } from "../hooks/useApi"
import io from "socket.io-client"
import { useParams } from "react-router-dom"
import { formatDuration } from "../utils"
import * as Mui from "@mui/material"
import styled from "styled-components"

type Data = {
  remainingTime: string
  name: string
  remainingSeconds: number
  reward: Reward
}

const DataContext = React.createContext<Data[]>([])

const useTimerData = () => React.useContext(DataContext)

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

  const [value, setValue] = React.useState<Data[]>([])

  React.useEffect(() => {
    const result: Data[] = []

    const now = Date.now()

    for (const reward of rewards) {
      if (new Date(reward.endsAt.toString()).getTime() < now) {
        continue
      }

      const seconds = Math.floor(
        (new Date(reward.endsAt.toString()).getTime() - now) / 1000
      )

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
    <DataContext.Provider value={value}>
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
    </DataContext.Provider>
  )
}

const OverlayContent: React.FC = () => {
  const { key } = useParams<"key">()
  const user = useApi<User>(`/overlay/${key}`)

  return (
    <Box sx={{ width: "100%", height: "100%", "& pre": { margin: 0 } }}>
      <LiveProvider
        code={user.overlayCode}
        scope={{ useTimerData, Mui, styled }}
        noInline
      >
        <LivePreview />
        <LiveError />
      </LiveProvider>
    </Box>
  )
}
