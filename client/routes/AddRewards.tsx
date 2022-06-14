import { Add } from "@mui/icons-material"
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { rewardSchema } from "../schema"
import { useApi } from "../hooks/useApi"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { Navigate, useNavigate } from "react-router-dom"

export const AddRewards: React.FC = () => {
  const rewards = useApi<{ id: string; name: string }[]>(
    "/twitch/rewards?excludeIncluded=1"
  )

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      rewardId: "",
      name: "",
      time: 60,
    },
    resolver: zodResolver(rewardSchema),
  })

  const [error, setError] = React.useState<null | string>(null)

  const navigate = useNavigate()

  return (
    <Paper
      sx={{ maxWidth: "400px", width: "100%", mx: "auto", p: 2 }}
      variant="outlined"
      component={Stack}
      direction="column"
      spacing={2}
    >
      {error && <Alert severity="error">{error}</Alert>}
      <form
        onSubmit={handleSubmit(async (v) => {
          setError(null)
          const { data } = await axios.post("/rewards", v, {
            validateStatus: () => true,
          })

          if (data.error) {
            setError(data.error)
          }

          if (data.id) {
            navigate(`/rewards/${data.id}`)
          }
        })}
      >
        <Typography variant="h6" fontWeight={600}>
          타이머 추가하기
        </Typography>
        <Stack direction="column" gap={2}>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <TextField
                disabled={isSubmitting}
                variant="standard"
                label="이름"
                value={field.value}
                name={field.name}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="rewardId"
            render={({
              field: { onBlur, onChange, name, value },
              fieldState,
            }) => (
              <FormControl
                fullWidth
                disabled={isSubmitting}
                variant="standard"
                error={!!fieldState.error}
              >
                <InputLabel id="rewardId">트위치 리워드 선택</InputLabel>
                <Select
                  disabled={isSubmitting}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  name={name}
                  variant="standard"
                  labelId="rewardId"
                >
                  {rewards.map((x, i) => (
                    <MenuItem value={x.id} key={i}>
                      {x.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && (
                  <FormHelperText>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="time"
            render={({ field: { ref, onChange, ...field }, fieldState }) => (
              <TextField
                disabled={isSubmitting}
                label="타이머 시간"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                type="number"
                variant="standard"
                {...field}
                onChange={(e) => onChange(Number(e.target.value))}
              />
            )}
          />
          <Button
            type="submit"
            startIcon={<Add />}
            fullWidth
            variant="contained"
            disableElevation
            disabled={isSubmitting}
          >
            추가하기
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
