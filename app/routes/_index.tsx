import React, { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { useYjs } from "~/context"
import { useSubscribeYjs } from "~/use-yjs-data"
import { Link } from "@remix-run/react"

const formSchema = z.object({
  url: z.string().regex(/http/),
})

function NameForm({ trpc }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: ``,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    const result = await trpc.downloadYoutubeInfo.mutate({
      youtubeUrl: values.url,
    })
    console.log({ result })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Youtube URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={form.formState.isSubmitting} type="submit">
          Submit
        </Button>
      </form>
    </Form>
  )
}

function RecentCallsTable({ doc }) {
  const calls = useSubscribeYjs(doc?.getArray(`trpc-calls`))
  const sortedFilteredCalls = calls
    .filter((call) => Object.prototype.hasOwnProperty.call(call, `createdAt`))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 10)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">path</TableHead>
          <TableHead>input</TableHead>
          <TableHead>elapsedMs</TableHead>
          <TableHead>done</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedFilteredCalls.map((call) => (
          <TableRow key={call.id}>
            <TableCell className="font-medium">{call.path}</TableCell>
            <TableCell>{JSON.stringify(call.input)}</TableCell>
            <TableCell>{call.elapsedMs}</TableCell>
            <TableCell>{JSON.stringify(call.done)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function Index() {
  const { doc, trpc } = useYjs()
  const videos = useSubscribeYjs(doc?.getMap(`videos`))
  console.log({ videos })

  return (
    <div className="container relative mt-8">
      <div className="flex flex-row items-center mb-4 ">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
          <Link to="/">Youtube Transcript Prompt Testing</Link>
        </h1>
      </div>
      <div className="flex flex-row mb-6">
        <div className="basis-2/3 p-2">
          <h2 className="text-xl font-bold mb-1">Videos</h2>
          <div className="overflow-hidden p-2 rounded-[0.5rem] border bg-background shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">thumbnail</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(videos).map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium h-32">
                      <Link to={`/video/${video.id}`}>
                        <img src={video.thumbnail_url} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/video/${video.id}`}>{video.title}</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="basis-1/3 p-2 pl-4">
          <h2 className="text-xl font-bold">Add Video</h2>
          <div className="flex flex-col">
            <NameForm trpc={trpc} />
          </div>
        </div>
      </div>
      <h2 className="text-3xl font-bold">tRPC call log</h2>
      <RecentCallsTable doc={doc} />
    </div>
  )
}
