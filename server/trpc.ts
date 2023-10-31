import { initTRPC, TRPCError } from "@trpc/server"
import { z } from "zod"
import Y from "yjs"
import { Innertube } from "youtubei.js"
import getYoutubeId from "get-youtube-id"
import { YoutubeTranscript } from "youtube-transcript"
const youtube = require(`youtube-metadata-from-url`)
import { chunk } from "../app/chunk-transcript"
import { summarizeChunks } from "../ai-test"

// let youtube
// console.log({ Innertube })

// async function initYoutube() {
// console.log(`hi2`)
// youtube = await Innertube.create({
// retrieve_player: false,
// generate_session_locally: true,
// })
// console.log({ youtube })
// }
// initYoutube()

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create()
/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
const router = t.router
const publicProcedure = t.procedure

type TransactFunction = (action: () => void) => void

export const appRouter = router({
  downloadYoutubeInfo: publicProcedure
    .input(z.object({ youtubeUrl: z.string() }))
    .mutation(async (opts) => {
      const {
        input,
        ctx: { videos, transact, response },
      } = opts
      console.log(opts.ctx)

      const id = getYoutubeId(input.youtubeUrl)

      const transcript = await YoutubeTranscript.fetchTranscript(
        input.youtubeUrl
      )
      response.set(`progress`, 0.5)
      const metadata = await youtube.metadata(input.youtubeUrl)

      // Run in transaction along with setting response on the request
      // object.
      transact(() => {
        videos.set(id, { id, transcript, summaries: [], ...metadata })
        response.set(`ok`, true)
        response.set(`progress`, 1)
      })
    }),
  summarize: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const {
        input,
        ctx: { videos, transact, response },
      }: {
        input: any
        ctx: {
          videos: Y.Map<any>
          transact: TransactFunction
          response: Y.Map<any>
        }
      } = opts as any
      let video = videos.get(input.id)

      const chunks = chunk(video.transcript, true)
      response.set(`progress`, 0.1)
      console.log(`chunks length`, chunks.length)
      video = await summarizeChunks(chunks, video, response)

      transact(() => {
        videos.set(input.id, video)
        response.set(`ok`, true)
        response.set(`progress`, 1)
      })
    }),
})

export type AppRouter = typeof appRouter
