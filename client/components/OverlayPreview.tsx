import { Alert, Paper, Stack } from "@mui/material"
import React from "react"
import { LiveContext, LivePreview } from "react-live"

export const OverlayPreview: React.FC = () => {
  const ctx = React.useContext(LiveContext)

  return (
    <Stack direction="column" gap={2}>
      {ctx.error && (
        <Alert severity="error">
          <pre style={{ margin: 0 }}>{ctx.error}</pre>
        </Alert>
      )}
      {!ctx.error && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <LivePreview />
        </Paper>
      )}
    </Stack>
  )
}
