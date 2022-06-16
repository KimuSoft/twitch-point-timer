import { Reward } from "@prisma/client"
import React from "react"
import { transform } from "sucrase"
import * as Mui from "@mui/material"
import styled from "styled-components"
import { motion, AnimatePresence, AnimateSharedLayout } from "framer-motion"

export const formatDuration = (seconds: number) => {
  let minute = seconds / 60
  const second = seconds % 60
  const hour = minute / 60
  minute = minute % 60
  return `${
    hour >= 1
      ? Math.floor(hour).toLocaleString("en-US", {
          minimumIntegerDigits: 2,
        }) + ":"
      : ""
  }${Math.floor(minute).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
  })}:${Math.floor(second).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
  })}`
}

export type OverlayData = {
  remainingTime: string
  name: string
  remainingSeconds: number
  reward: Reward
}

export const OverlayDataContext = React.createContext<OverlayData[]>([])

export const useTimerData = () => React.useContext(OverlayDataContext)

const errorBoundary = (
  Element: React.Component | React.ReactNode,
  errorCallback: (error: any) => void
) => {
  return class ErrorBoundary extends React.Component {
    componentDidCatch(error: any) {
      errorCallback(error)
    }

    render() {
      return typeof Element === "function" ? (
        // @ts-ignore
        <Element />
      ) : React.isValidElement(Element) ? (
        Element
      ) : null
    }
  }
}

export default errorBoundary

export const useTimerComponent = (
  code: string
): { Node?: React.ReactNode; error?: Error } => {
  const [result, setResult] = React.useState<{
    Node?: React.ReactNode
    error?: Error
  }>({})

  React.useEffect(() => {
    try {
      const transpiled = transform(code, {
        transforms: ["jsx", "imports"],
      }).code

      let result: React.ReactNode = null

      new Function(
        "useTimerData",
        "Mui",
        "styled",
        "render",
        "React",
        "motion",
        "AnimatePresence",
        "AnimateSharedLayout",
        transpiled
      )(
        useTimerData,
        Mui,
        styled,
        (element: React.ReactNode) => {
          result = element
        },
        React,
        motion,
        AnimatePresence,
        AnimateSharedLayout
      )

      const Node = errorBoundary(result, (err) => {
        setResult({ error: err })
      })

      setResult({ Node: <Node /> || undefined })
    } catch (e: any) {
      setResult({ error: e })
    }
  }, [code])

  return result
}
