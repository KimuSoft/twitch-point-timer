import { javascript } from "@codemirror/lang-javascript"
import { Save } from "@mui/icons-material"
import { Button, ListItemButton, Paper, Stack } from "@mui/material"
import { User } from "@prisma/client"
import ReactCodeMirror from "@uiw/react-codemirror"
import axios from "axios"
import React from "react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { HiddenTextField } from "../components/HiddenTextField"
import { useApi } from "../hooks/useApi"
import * as Mui from "@mui/material"
import { OverlayData, OverlayDataContext, useTimerComponent } from "../utils"

const previewOverlayDataTemplate: (index: number) => OverlayData = (index) => ({
  name: `Reward #${index}`,
  remainingTime: "1:00",
  remainingSeconds: 60,
  reward: {
    id: `preview${index}`,
    endsAt: new Date(Date.now() + 60 * 1000),
    name: "Hello",
    time: 120,
    userId: "1",
  },
})

const Preview: React.FC<{ code: string }> = ({ code }) => {
  const { Node: previewElement, error: previewError } = useTimerComponent(code)

  const [scale, setScale] = React.useState(0)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (containerRef.current && contentRef.current) {
      const container = containerRef.current
      const content = contentRef.current

      const observer = new ResizeObserver(() => {
        setScale(
          Math.min(
            container.clientWidth / content.clientWidth,
            container.clientHeight / content.clientHeight
          )
        )
        console.log(container.clientWidth, content.clientHeight)
      })

      observer.observe(container)
      observer.observe(content)

      return () => {
        observer.disconnect()
      }
    }
  }, [containerRef.current, contentRef.current])

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
      ref={containerRef}
    >
      <div style={{ width: 0, height: 0, overflow: "hidden" }}>
        <div
          ref={contentRef}
          style={{
            minWidth: 300,
            height: "fit-content",
          }}
        >
          {previewElement}
        </div>
      </div>
      <div
        style={{
          transform: `scale(${scale})`,
          minWidth: 300,
        }}
      >
        {previewError && (
          <Mui.Alert severity="error">{previewError.stack}</Mui.Alert>
        )}
        {previewElement}
      </div>
    </div>
  )
}

export const Home: React.FC = () => {
  const { overlayCode, overlayId } = useApi<User>("/me")
  const overlays = useApi<{ name: string; code: string }[]>(
    "/predefinedOverlays"
  )

  const [code, setCode] = React.useState(overlayCode)

  const save = async () => {
    toast.promise(() => axios.post("/code", { code: code }), {
      pending: "저장하는 중...",
      error: "코드 저장 실패",
      success: "코드가 저장되었습니다",
    })
  }

  const [presetWindowOpen, setPresetWindowOpen] = React.useState(false)

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

  const { Node: previewElement, error: previewError } = useTimerComponent(code)

  const [previewDataCount, setPreviewDataCount] = React.useState(1)

  const previewOverlayData = React.useMemo(() => {
    return new Array(previewDataCount)
      .fill(0)
      .map((_, i) => previewOverlayDataTemplate(i + 1))
  }, [previewDataCount])

  return (
    <div>
      <Mui.Dialog
        open={presetWindowOpen}
        onClose={() => setPresetWindowOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Mui.DialogTitle>프리셋 로드</Mui.DialogTitle>
        <Mui.DialogContent>
          <OverlayDataContext.Provider value={[previewOverlayDataTemplate(1)]}>
            <Mui.Grid container spacing={2}>
              {overlays.map((x, i) => (
                <Mui.Grid item xs={12} sm={6} key={i}>
                  <Paper sx={{ overflow: "hidden" }} variant="outlined">
                    <Mui.CardActionArea
                      onClick={() => {
                        setCode(x.code)
                        setPresetWindowOpen(false)
                      }}
                    >
                      <Mui.CardMedia
                        sx={{
                          aspectRatio: "16 / 9",
                          display: "flex",
                          p: 2,
                        }}
                      >
                        <Preview code={x.code} />
                      </Mui.CardMedia>
                      <Mui.Divider />
                      <Mui.Typography sx={{ p: 2 }} variant="h6">
                        {x.name}
                      </Mui.Typography>
                    </Mui.CardActionArea>
                  </Paper>
                </Mui.Grid>
              ))}
            </Mui.Grid>
          </OverlayDataContext.Provider>
        </Mui.DialogContent>
      </Mui.Dialog>
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
        <Stack
          sx={{
            flexDirection: "row",
            "@media screen and (max-width: 768px)": { flexDirection: "column" },
          }}
          spacing={2}
        >
          <Button
            variant="outlined"
            onClick={() =>
              setPreviewDataCount((v) => {
                if (v !== 0) return v - 1
                return v
              })
            }
          >
            -1
          </Button>
          <Button variant="outlined" sx={{ whiteSpace: "nowrap" }}>
            Count: {previewDataCount}
          </Button>
          <Button
            variant="outlined"
            onClick={() => setPreviewDataCount((v) => v + 1)}
          >
            +1
          </Button>
          <Button
            sx={{ flexGrow: 1 }}
            variant="outlined"
            onClick={() => setPresetWindowOpen(true)}
          >
            프리셋 불러오기
          </Button>
          <Button
            sx={{ flexGrow: 1 }}
            onClick={save}
            startIcon={<Save />}
            variant="outlined"
          >
            코드 저장
          </Button>
        </Stack>
        <OverlayDataContext.Provider value={previewOverlayData}>
          {previewElement && (
            <Mui.Paper
              variant="outlined"
              sx={{
                p: 4,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 300 }}>{previewElement}</div>
            </Mui.Paper>
          )}
        </OverlayDataContext.Provider>

        {previewError && (
          <Mui.Alert severity="error">
            <pre style={{ margin: 0 }}>{previewError.stack}</pre>
          </Mui.Alert>
        )}
        <ReactCodeMirror
          value={code}
          lang="javascript"
          extensions={[javascript({ jsx: true })]}
          onChange={(v) => setCode(v)}
        />
      </Stack>
    </div>
  )
}
