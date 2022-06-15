import {
  CopyAll,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material"
import {
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
} from "@mui/material"
import React from "react"
import { toast } from "react-toastify"

export const HiddenTextField: React.FC<TextFieldProps> = ({
  InputProps,
  ...props
}) => {
  const [visible, setVisible] = React.useState(false)

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => {
                toast.promise(
                  navigator.clipboard.writeText(props.value as string),
                  {
                    pending: "복사중..",
                    error: "복사 실패",
                    success: "복사 성공",
                  }
                )
              }}
            >
              <CopyAll />
            </IconButton>
            <IconButton sx={{ ml: 1 }} onClick={() => setVisible((v) => !v)}>
              {visible ? <VisibilityRounded /> : <VisibilityOffRounded />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
