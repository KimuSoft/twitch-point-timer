import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { Reward } from "@prisma/client"
import axios from "axios"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { useApi } from "../hooks/useApi"
import { zodResolver } from "@hookform/resolvers/zod"
import { rewardEditSchema } from "../schema"
import { Delete, Save } from "@mui/icons-material"
import { toast } from "react-toastify"

export const RewardEdit: React.FC = () => {
  const { id } = useParams<"id">()

  const reward = useApi<Reward>(`/rewards/${id}`)

  const rewards = useApi<{ id: string; name: string }[]>("/twitch/rewards")

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: reward,
    resolver: zodResolver(rewardEditSchema),
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
        onSubmit={handleSubmit(async (v) =>
          toast.promise(
            async () => {
              setError(null)
              const { data } = await axios.patch(`/rewards/${reward.id}`, v, {
                validateStatus: () => true,
              })

              if (data.error) {
                setError(data.error)
              }
            },
            {
              error: "저장 실패",
              pending: "저장하는 중...",
              success: "저장되었습니다",
            }
          )
        )}
      >
        <Typography variant="h6" fontWeight={600}>
          타이머 수정하기
        </Typography>
        <Stack direction="column" gap={2} sx={{ mt: 2 }}>
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

          <TextField
            label="리워드"
            variant="standard"
            disabled
            value={rewards.find((x) => x.id === reward.id)?.name ?? "Unknown"}
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
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              startIcon={<Save />}
              fullWidth
              variant="contained"
              disableElevation
              disabled={isSubmitting}
            >
              수정하기
            </Button>
            <Button
              startIcon={<Delete />}
              fullWidth
              color="error"
              variant="contained"
              disableElevation
              disabled={isSubmitting}
              onClick={() => {
                if (confirm("삭제할까요?")) {
                  toast
                    .promise(async () => axios.delete(`/rewards/${id}`), {
                      error: "삭제 실패",
                      pending: "삭제중..",
                      success: "삭제 성공",
                    })
                    .then(() => {
                      navigate("/rewards")
                    })
                }
              }}
            >
              삭제하기
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  )
}
