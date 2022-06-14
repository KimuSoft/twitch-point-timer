import { z } from "zod"
import { zfd } from "zod-form-data"

export const rewardSchema = z.object({
  name: z.string().min(1),
  rewardId: z.string().min(1),
  time: zfd.numeric(z.number().int()),
})

export const rewardEditSchema = z.object({
  name: z.string().min(1),
  time: zfd.numeric(z.number().int()),
})
