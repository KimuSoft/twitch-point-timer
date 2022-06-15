import "dotenv/config"
import { Prisma, PrismaClient, User as DbUser, User } from "@prisma/client"
import { AuthProvider, RefreshingAuthProvider } from "@twurple/auth"
import { PubSubClient } from "@twurple/pubsub"
import express from "express"

import SocketIO from "socket.io"
import { createServer } from "http"
import passport from "passport"
import { Strategy } from "@hewmen/passport-twitch"
import session from "express-session"
import { ApiClient } from "@twurple/api"
import path from "path"

import ConnectRedis from "connect-redis"
import Redis from "ioredis"
import { rewardEditSchema, rewardSchema } from "./schema"
import { z } from "zod"

process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)

const RedisStore = ConnectRedis(session)

const prisma = new PrismaClient()

const app = express()

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
    store: process.env.REDIS
      ? new RedisStore({
          client: new Redis() as unknown as ConnectRedis.Client,
        })
      : undefined,
  })
)

const server = createServer(app)

const io = new SocketIO.Server(server)

const pubsubClient = new PubSubClient()

const providerMap = new Map<string, AuthProvider>()
const apiClientMap = new Map<string, ApiClient>()

const clientId = process.env.TWITCH_CLIENT_ID!

const clientSecret = process.env.TWITCH_CLIENT_SECRET!

passport.use(
  new Strategy(
    {
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: process.env.TWITCH_CALLBACK!,
      scope: ["channel:read:redemptions"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await prisma.user.upsert({
          create: {
            id: profile.id,
            accessToken,
            refreshToken,
            expiresIn: 0,
            obtainmentTimestamp: new Date(),
          },
          where: {
            id: profile.id,
          },
          update: {
            accessToken,
            refreshToken,
            expiresIn: 0,
            obtainmentTimestamp: new Date(),
          },
        })
        await addUserProvider(user)

        done(null, user)
      } catch (e: any) {
        done(e)
      }
    }
  )
)

declare global {
  namespace Express {
    interface User extends DbUser {}
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    done(
      null,
      await prisma.user.findUnique({
        rejectOnNotFound: true,
        where: { id: id as string },
      })
    )
  } catch (e) {
    done(null, null)
  }
})

app.use(passport.initialize())

app.use(passport.session())

app.use(express.json())

app.use(express.static(path.join(__dirname, "../client-out")))

app.get("/authorized", (req, res) => res.json(!!req.user))

app.get("/login", passport.authenticate("twitch", { successRedirect: "/" }))

app.get("/overlay/:key", async (req, res, next) => {
  if (!req.params.key) return next()

  const user = await prisma.user.findUnique({
    where: { overlayId: req.params.key },
  })

  if (!user) return next()

  return res.json({overlayCode: user.overlayCode})
})

const addTimeSchema = z.object({
  reward: z.string(),
  time: z.number(),
  overlay: z.string(),
})

app.post("/addTime", async (req, res) => {
  const result = await addTimeSchema.safeParseAsync(req.body)

  if (!result.success)
    return res.status(400).json({ error: "Validation failed" })

  const data = result.data

  const user = await prisma.user.findUnique({
    where: { overlayId: data.overlay },
  })

  if (!user) return res.status(401).json({ error: "Unauthorized" })

  const reward = await prisma.reward.findFirst({
    where: { id: data.reward, userId: user.id },
  })

  if (!reward) return res.status(404).json({ error: "Reward not found" })

  let endsAt = reward.endsAt.getTime()

  const now = Date.now()

  if (endsAt < now) {
    endsAt = now
  }

  endsAt += data.time * 1000

  await prisma.reward.update({
    where: { id: reward.id },
    data: { endsAt: new Date(endsAt) },
  })

  console.log(`Reward ${reward.id} + ${reward.time} seconds`)

  io.in(`user-${user.id}`).emit(
    "updateData",
    await prisma.reward.findMany({
      where: { userId: user.id },
      orderBy: { id: "asc" },
    })
  )

  res.json({ ok: 1 })
})

app.use((req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })

  next()
})

const codeSchema = z.object({
  code: z.string(),
})

app.post("/code", async (req, res) => {
  const result = await codeSchema.safeParseAsync(req.body)

  if (!result.success)
    return res.status(400).json({ error: "Validation failed" })

  await prisma.user.update({
    where: {
      id: req.user!.id,
    },
    data: {
      overlayCode: result.data.code,
    },
  })

  res.json({ ok: 1 })
})

const defaultCode = `
function Timer() {
  const timers = useTimerData()

  return <div>
    {timers.map((x,i) => <div key={i}>{x.name} 남은 시간: {x.remainingTime}</div>)}
  </div>
}
`.trim()

app.get("/me", (req, res) => {
  const user = req.user!
  res.json({
    id: user.id,
    overlayCode: user.overlayCode || defaultCode,
    overlayId: user.overlayId,
  })
})

app.get("/rewards", async (req, res) => {
  const user = req.user!

  res.json(
    await prisma.reward.findMany({
      where: {
        userId: user.id,
      },
    })
  )
})

app.post("/rewards", async (req, res) => {
  const result = await rewardSchema.safeParseAsync(req.body)

  if (!result.success)
    return res.status(400).json({ error: "Validation failed" })

  const data = result.data

  if (
    await prisma.reward.findFirst({
      where: { id: data.rewardId, userId: req.user!.id },
    })
  ) {
    return res.status(400).json({ error: "Reward already exists." })
  }

  const { id } = await prisma.reward.create({
    data: {
      id: data.rewardId,
      name: data.name,
      time: data.time,
      user: {
        connect: {
          id: req.user!.id,
        },
      },
    },
  })

  io.in(`user-${req.user!.id}`).emit(
    "updateData",
    await prisma.reward.findMany({
      where: { userId: req.user!.id },
      orderBy: { id: "asc" },
    })
  )

  res.json({ id })
})

app.get("/rewards/:id", async (req, res) => {
  const item = await prisma.reward.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  })

  res.json(item)
})

app.delete("/rewards/:id", async (req, res) => {
  const item = await prisma.reward.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  })

  if (!item) return res.status(404).json({ error: "Reward not found" })

  await prisma.reward.delete({ where: { id: item.id } })

  io.in(`user-${req.user!.id}`).emit(
    "updateData",
    await prisma.reward.findMany({
      where: { userId: req.user!.id },
      orderBy: { id: "asc" },
    })
  )

  return res.json({ ok: 1 })
})

app.patch("/rewards/:id", async (req, res) => {
  const item = await prisma.reward.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id,
    },
  })

  if (!item) return res.status(404).json({ error: "Reward not found" })

  const result = await rewardEditSchema.safeParseAsync(req.body)

  if (!result.success)
    return res.status(400).json({ error: "Validation failed" })

  const data = result.data

  const updated = await prisma.reward.update({
    where: { id: req.params.id },
    data: {
      name: data.name,
      time: data.time,
    },
  })

  io.in(`user-${req.user!.id}`).emit(
    "updateData",
    await prisma.reward.findMany({
      where: { userId: req.user!.id },
      orderBy: { id: "asc" },
    })
  )

  res.json(updated)
})

app.get("/twitch/rewards", async (req, res) => {
  const user = req.user!

  const api = apiClientMap.get(user.id || "")

  if (!api) return res.json({ error: "client not found" })

  const rewards = await api.channelPoints.getCustomRewards(user.id)

  const rewardIds =
    (
      await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          rewards: {
            select: {
              id: true,
            },
          },
        },
      })
    )?.rewards.map((x) => x.id) || []

  res.json(
    rewards
      .filter((x) =>
        req.query.excludeIncluded ? !rewardIds.includes(x.id) : true
      )
      .map((x) => ({
        id: x.id,
        name: x.title,
      }))
  )
})

app.get("/logout", (req, res) => {
  req.logout(() => {
    res.send("ok")
  })
})

io.sockets.on("connection", async (socket) => {
  const user = await prisma.user.findFirst({
    where: { overlayId: socket.handshake.query.overlay as string },
    include: {
      rewards: { orderBy: { id: "asc" } },
    },
  })

  if (!user) return socket.disconnect()

  socket.join(`user-${user.id}`)

  socket.emit("updateData", user.rewards)
})

const addUserProvider = async (user: DbUser) => {
  if (providerMap.has(user.id)) return

  const provider = new RefreshingAuthProvider(
    {
      clientId,
      clientSecret,
      onRefresh: async (tokenData) => {
        console.log(`Token refreshed user:`, user.id)
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            obtainmentTimestamp: new Date(),
            accessToken: tokenData.accessToken,
            expiresIn: tokenData.expiresIn || undefined,
            refreshToken: tokenData.refreshToken || undefined,
          },
        })
      },
    },
    {
      obtainmentTimestamp: user.obtainmentTimestamp.getTime(),
      expiresIn: user.expiresIn,
      scope: ["channel:read:redemptions"],
      refreshToken: user.refreshToken,
      accessToken: user.accessToken,
    }
  )

  providerMap.set(user.id, provider)

  apiClientMap.set(
    user.id,
    new ApiClient({
      authProvider: provider,
    })
  )

  const id = await pubsubClient.registerUserListener(provider)

  pubsubClient.onRedemption(id, async (msg) => {
    const reward = await prisma.reward.findUnique({
      where: { id: msg.rewardId },
    })

    if (reward) {
      let endsAt = reward.endsAt.getTime()

      const now = Date.now()

      if (endsAt < now) {
        endsAt = now
      }

      endsAt += reward.time * 1000

      await prisma.reward.update({
        where: { id: reward.id },
        data: { endsAt: new Date(endsAt) },
      })

      console.log(`Reward ${reward.id} + ${reward.time} seconds`)

      io.in(`user-${user.id}`).emit(
        "updateData",
        await prisma.reward.findMany({
          where: { userId: user.id },
          orderBy: { id: "asc" },
        })
      )
    }
  })

  console.log(`User auth provider registered: ${user.id}`)
}

const run = async () => {
  const users = await prisma.user.findMany()

  for (const user of users) {
    await addUserProvider(user)
  }

  server.listen(process.env.PORT || 3000, () => {
    console.log("listening")
  })
}

run().then()
