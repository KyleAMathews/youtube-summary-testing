import React, { useState } from "react"
import { useParams, Link } from "@remix-run/react"
import { useYjs } from "~/context"
import { useSubscribeYjs } from "~/use-yjs-data"
import { groupBy } from "lodash"
import { chunk } from "../chunk-transcript"
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"

function Summary({ summary }) {
  const [open, toggleOpen] = useState(false)
  return (
    <div className="border-sky-400 border-solid border-2 mb-4 p-4">
      <p className="mb-4">{summary.summary}</p>
      <Button onClick={() => (open ? toggleOpen(false) : toggleOpen(true))}>
        Show {open ? `none` : `more`}
      </Button>
      <div className="mt-4 pl-8" style={{ display: open ? `block` : `none` }}>
        {summary.chunkSummaries.map((chunk, i) => (
          <div key={`summary-chunk-${i}`}>
            <h4 className="text-xl mb-2 underline">{i * 5}:00</h4>
            <p className="mb-4">{chunk}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function uuidv4() {
  return `10000000-1000-4000-8000-100000000000`.replace(
    /[018]/g,
    (c: any): string =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
  )
}

export default function Video() {
  const { id } = useParams()
  const [open, toggleOpen] = useState(false)
  const [currentCallId, setCallId] = useState(``)
  console.log({ id })
  const { doc, trpc } = useYjs()
  console.log({ trpc })
  let currentCallYjs
  for (const call of doc?.getArray(`trpc-calls`)) {
    if (call.get(`id`) == currentCallId) {
      currentCallYjs = call
      break
    }
  }
  console.log({ currentCallId, currentCallYjs })
  const videos = useSubscribeYjs(doc?.getMap(`videos`))
  // const currentCallYjs = doc
  // ?.getArray(`trpc-calls`)
  // ?.filter((c) => c.callId == currentCallId)
  const currentCall = useSubscribeYjs(currentCallYjs)
  const response = Object.assign({}, currentCall?.response)
  console.log({ response })
  console.log({ currentCall })

  const video = videos[id]
  console.log(video)
  const chunks = chunk(video.transcript, true)
  console.log({ chunks })
  console.log(open ? `block` : `none`)
  return (
    <div className="container relative mt-8">
      <div className="">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1] mb-4">
          <Link to="/">Youtube Transcript Prompt Testing</Link>
        </h1>
        <h2 className="text-2xl font-bold leading-tight tracking-tighter md:text-3xl lg:leading-[1.1] mb-5">
          {video.title} —{` `}
          {Math.round(video.transcript?.slice(-1)[0].offset / 1000 / 60)}m
        </h2>
      </div>
      <Button
        onClick={async () => {
          const callId = uuidv4()
          setCallId(callId)
          const result = await trpc.summarize.mutate({ id, callId })
          console.log({ result })
        }}
        className="mb-4"
      >
        summarize
      </Button>
      {response && response.progress && response.progress != 1 && (
        <Progress value={response.progress * 100} />
      )}
      <div>
        <h3 className="text-2xl mt-2 mb-2">
          Summaries ({video.summaries?.length || 0})
        </h3>
        {video.summaries?.slice(-2)?.map((summary, i) => {
          return <Summary key={`summary-${i}`} summary={summary} />
        })}
      </div>
      <div className="">
        <Button onClick={() => (open ? toggleOpen(false) : toggleOpen(true))}>
          {open ? `hide transcript` : `show full transcript`}
        </Button>
        <div style={{ display: open ? `block` : `none` }}>
          {chunks.map((chunk, i) => {
            return (
              <div className="mb-8" key={`transcript-${i}`}>
                <h3 className="font-bold text-xl">{i * 5}:00 mins</h3>
                <div>{chunk}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
