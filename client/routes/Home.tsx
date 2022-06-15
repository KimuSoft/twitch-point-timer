import { javascript } from "@codemirror/lang-javascript"
import { Save } from "@mui/icons-material"
import { Button, ListItemButton, Paper, Stack } from "@mui/material"
import { User } from "@prisma/client"
import ReactCodeMirror from "@uiw/react-codemirror"
import axios from "axios"
import React from "react"
import { LiveProvider } from "react-live"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { HiddenTextField } from "../components/HiddenTextField"
import { OverlayPreview } from "../components/OverlayPreview"
import { useApi } from "../hooks/useApi"
import * as Mui from "@mui/material"
import styled from "styled-components"

const useTimerData = () => {
  return [
    {
      name: "Hello",
      remainingTime: "1:00",
    },
    {
      name: "Hello",
      remainingTime: "1:00",
    },
    {
      name: "Hello",
      remainingTime: "1:00",
    },
  ]
}

export const Home: React.FC = () => {
  const { overlayCode, overlayId } = useApi<User>("/me")

  const [code, setCode] = React.useState(overlayCode)

  const save = async () => {
    toast.promise(() => axios.post("/code", { code: code }), {
      pending: "저장하는 중...",
      error: "코드 저장 실패",
      success: "코드가 저장되었습니다",
    })
  }

  const overlayURL = React.useMemo(() => {
    const url = new URL(window.location.href)
    url.hash = `#/overlay/${overlayId}`

    return url.toString()
  }, [overlayId])

  const controllerURL = React.useMemo(() => {
    const url = new URL(window.location.href)
    url.hash = `#/controller/${overlayId}`

    return url.toString()
  }, [overlayId])

  return (
    <div>
      <Stack spacing={2} direction="column">
        <Paper variant="outlined">
          <ListItemButton sx={{ p: 2 }} component={Link} to="/rewards">
            타이머 관리
          </ListItemButton>
        </Paper>
        <HiddenTextField
          label="오버레이 URL"
          value={overlayURL}
          InputProps={{ readOnly: true }}
        />
        <HiddenTextField
          label="컨트롤러 URL"
          value={controllerURL}
          InputProps={{ readOnly: true }}
        />
        <Button
          fullWidth
          onClick={save}
          startIcon={<Save />}
          variant="outlined"
        >
          코드 저장
        </Button>
        <ReactCodeMirror
          value={code}
          lang="javascript"
          extensions={[javascript({ jsx: true })]}
          onChange={(v) => setCode(v)}
        />
        <LiveProvider
          code={code}
          scope={{ useTimerData, Mui, styled }}
          noInline
        >
          <OverlayPreview />
        </LiveProvider>
      </Stack>
    </div>
  )
}
