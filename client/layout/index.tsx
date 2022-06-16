import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material"
import React from "react"
import { Link, Outlet } from "react-router-dom"
import { useApi } from "../hooks/useApi"

export const Layout: React.FC = () => {
  return (
    <React.Suspense fallback="Loading...">
      <LayoutContent />
    </React.Suspense>
  )
}

const LayoutContent: React.FC = () => {
  const authorized = useApi<boolean>("/authorized")

  if (!authorized) {
    window.location.href = "/login"
  }

  return (
    <div>
      <AppBar>
        <Toolbar>
          <Typography
            component={Link}
            to="/"
            color="white"
            sx={{ textDecoration: "none" }}
            variant="h6"
            fontWeight={600}
          >
            Point Overlay
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" variant="outlined" href="/logout">
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>
      <Toolbar />

      <Container sx={{ mt: 2 }}>
        <ErrorBoundary>
          <React.Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </React.Suspense>
        </ErrorBoundary>
      </Container>
    </div>
  )
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props)

    this.state = { error: null }
  }

  render(): React.ReactNode {
    return (
      <>
        {this.state.error ? (
          <Alert severity="error">{`${this.state.error}`}</Alert>
        ) : (
          this.props.children
        )}
      </>
    )
  }

  componentDidCatch(error: any) {
    this.setState({ error: error })
  }
}
