import { z } from "zod"

export const rewardSchema = z.object({
  name: z.string().min(1),
  rewardId: z.string().min(1),
  time: z.number().int(),
})

export const rewardEditSchema = z.object({
  name: z.string().min(1),
  time: z.number().int(),
})
