import {
  Button,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { Box } from "@mui/system"
import { Reward } from "@prisma/client"
import axios from "axios"
import React from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import { io } from "socket.io-client"
import { formatDuration } from "../utils"

export const TimeController: React.FC = () => {
  const { key } = useParams<"key">()

  const [rewards, setRewards] = React.useState<Reward[]>([])

  const [data, setData] = React.useState<
    (Reward & { remainingTime?: string })[]
  >([])

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
      console.log(data)
      setRewards(data)
    })

    socket.connect()

    return () => {
      socket.disconnect()
    }
  }, [])

  const [reload, setReload] = React.useState(false)

  React.useEffect(() => {
    const result: (Reward & { remainingTime?: string })[] = []

    const now = Date.now()

    for (const reward of rewards) {
      result.push({
        ...reward,
        remainingTime:
          reward.endsAt < now
            ? undefined
            : formatDuration(Math.floor((reward.endsAt - now) / 1000)),
      })
    }

    setData(result)

    const timeout = setTimeout(() => {
      setReload(!reload)
    }, 1000)

    return () => {
      clearTimeout(timeout)
    }
  }, [rewards, reload])

  return (
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
        <Box sx={{ p: 2 }}>
          <Grid container spacing={4}>
            {data.map((x, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="column" spacing={2}>
                    <Typography variant="h6" fontWeight={600}>
                      {x.name}
                    </Typography>
                    {x.remainingTime && (
                      <Typography>{x.remainingTime}</Typography>
                    )}
                    <Submitter reward={x} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </div>
  )
}

const Submitter: React.FC<{ reward: Reward }> = ({
  reward: { id, name, time },
}) => {
  const [value, setValue] = React.useState(time)
  const { key } = useParams<"key">()

  const add = React.useCallback(async () => {
    await axios.post("/addTime", {
      reward: id,
      time: value,
      overlay: key,
    })
  }, [value, name, id, key])

  return (
    <>
      <TextField
        fullWidth
        label="추가할 시간"
        type="number"
        value={value}
        InputProps={{
          endAdornment: <InputAdornment position="end">초</InputAdornment>,
        }}
        onChange={(e) => setValue(Number(e.target.value))}
      />
      <Button variant="contained" disableElevation onClick={add}>
        추가하기
      </Button>
    </>
  )
}
