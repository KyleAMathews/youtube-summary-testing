// This code is for v4 of the openai package: npmjs.com/package/openai
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import OpenAI from "openai"
const sdk = require(`api`)(`@pplx/v0#rht322clnm9gt25`)

sdk.auth(`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`)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function summarizeChunk(chunk, i, responseMap, progressAmount) {
  let response
  try {
    response = await sdk.post_chat_completions({
      model: `mistral-7b-instruct`,
      messages: [
        {
          role: `system`,
          content: `You produce dense summaries of articles and transcripts.`,
        },
        {
          role: `user`,
          content: `summarize this portion of a talk transcript (this is NOT the entire talk so don't use words like "start" or "conclude" in the summary as the end of this transcript isn't the end of the talk). The summary should be readable on its own but it'll also be used with other summaries of the talk to create an overall summary of the talk so be sure to include all information you need to summarize the talk as a whole.\n\n${chunk}`,
        },
      ],
    })
  } catch (e) {
    console.log(`chunk summary failed`, e)
  }

  console.log(`finished summary`, i)
  responseMap.set(`progress`, responseMap.get(`progress`) + progressAmount)

  return response.data.choices[0].message.content
}

async function reduceChunks(chunks) {
  let response
  try {
    response = await sdk.post_chat_completions({
      model: `mistral-7b-instruct`,
      messages: [
        {
          role: `system`,
          content: `You produce dense summaries of articles and transcripts.`,
        },
        {
          role: `user`,
          content: `The following is a linear set of summaries of portions of a transcript. Take information equally from each to create a cohesive summary of the transcript as a whole.\n\n ${chunks.join(
            `\n\n`
          )}`,
        },
      ],
    })
  } catch (e) {
    console.log(`error in final summary`, e)
  }

  return response
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 4000,
  chunkOverlap: 200,
})
export async function summarizeChunks(chunks, video, responseMap) {
  // Setup data structure on video.
  if (!video.summaries) {
    video.summaries = []
  }
  const summary = {}
  const numAPICalls = chunks.length + 1
  let summaries
  try {
    summaries = await Promise.all(
      chunks.map((chunk, i) =>
        summarizeChunk(chunk, i, responseMap, 1 / numAPICalls)
      )
    )
  } catch (e) {
    console.log(e)
  }
  summary.chunkSummaries = summaries

  const numTokens = summaries.join(` `).length / 1 / Math.E
  console.log(
    `chunk summaries done, starting final summary of ~${numTokens} tokens`
  )

  let response
  if (numTokens < 4000) {
    response = await reduceChunks(summaries)
  } else {
    // chunk again to get smaller summary.
    const output = (
      await splitter.createDocuments([summaries.join(`\n\n`)])
    ).map((p) => p.pageContent)
    console.log(`too many chunks, further reducing ${output.length} new chunks`)
    try {
      summaries = await Promise.all(
        output.map((chunk, i) => summarizeChunk(chunk, i))
      )
    } catch (e) {
      console.log(e)
    }
    const numTokens = summaries.join(` `).length / 1 / Math.E
    console.log(
      `2nd chunk summaries done, starting final summary of ~${numTokens} tokens`
    )
    response = await reduceChunks(summaries)
  }

  summary.summary = response.data.choices[0].message.content
  console.log(`summary is done`)
  video.summaries.push(summary)
  return video
}

// async function main() {
// const part1 = `hello everybody thanks for uh coming up to the table today it was really fun hearing everybody's stories about what what it was like playing my games sometimes with the parents sometimes with the parents not knowing um so uh so let me talk about the insoft was early days I'm a co-founder of vid software and I'm going to take you on a journey back to the beginning of the company's formation are you ready to be entertained all right uh I do realize uh there's a lot of doves here I do realize that there's uh that some of what I'm about to say may sound insane but we were in our 20s when we started in software and we didn't know there were any limits um so I grew up in a wonderful small town in northern California it was named Rockland and the population was 6 000 back then in the 70s I was massively addicted to spending loads of time in dark arcades and playing all of the games there and getting really good at them in 1979 before anyone had a computer at home really including me I went to local College when I was 11 years old and I started learning basic from the college students I basically just walked up to him and I asked him what the words on their listings meant and I wrote them all down and I experimented with them on the HP 9000 Mainframe that they had there at the college and to keep me at home my parents got me an Apple II plus I was done going outside uh I spent all my time programming games on that computer so a few years and about 20 Apple 2 games later I finally learned 6502 Assembly Language the language that all fast arcade games were written in then I could really make 80s games like these uh but not quite arcade games you know but home computer games which were on the Apple II and let's just say the Apple II was my personal home arcade as well as only one more million uh Apple II users back then so when I was a sophomore in high school I did some programming for the air force uh when I was 15 years old we lived in England then and my stepfather worked for the Air Force in order to get into the high school coding class I showed my teacher that I could program in 602 Assembly Language and I ended up at the aggressive Squadron the next day I was literally literally coding in a vault because I was a kid they gave me false data to use with my code I can't tell you what I was programming that's classified but a very odd but true story um and then after high school I kept making games and by 1987 I was working at origin systems and my first job was porting 2400 A.D from the Apple II to the Commodore 64 computer and by this time I had made 74 games and three previous game startup companies which were called Capital idea software Inside Out software where I ported my magic 2 to the Commodore 64. and ideas from the deep and I was 21 years old so I went to work at a company called Soft disc at the start of 1989 I learned how to program a Dos PC there and made you know a small game or a utility every single month for about a year and then I created a product at that company called Gamer's Edge and I had to hire the team of game developers a very small team so I hired John Carmack and uh Adrian Carmack who are not related into my department for programming in art and Tom Hall came in at night to help us out since he was already as soft as across the hall and he loved making games and this was the first time that any of us had actually worked with another person on a game after making them alone for 10 years that's what it was like in the 80s it was programming alone but it was incredible when we got together so while creating our first game uh it was called slordax John Carmack discovered this smooth scrolling trick on the PC so Tom Hall and John stayed up just one random night stayed up until 5 a.m making this demo uh that they called Dangerous Dave in copyright infringement the the next day I saw this disc on my desk and I ran the demo and I watched the screen scroll smoothly pixel by pixel and it was a massive Eureka moment for me it was like a bolt of lightning hit and I'll elaborate on why it was in a moment but if sophomore was born that instant on September 20th of 1990.`
// const part2 = `so one thing led to another and we spent about a week putting together a demo of Super Mario Brothers 3 for Nintendo on a PC which they liked we sent it to them they liked it but they decided not to publish it because they decided to only publish their games on their own NES platform which was a smart move no problem we just use the technology for a different game for the commander Keen Trilogy the very first Commander King Trilogy that we made [Applause] all right so you know why would a side scroller be a huge hit on PCS in 1990 well it's because no games on the PC could small could scroll smoothly horizontally per pixel at the time uh the PC had been out since August of 1981 but in nine years no one had ever figured out how to make the screen scroll smoothly that way until this dangerous Dave and copyright infringement demo which then led to Commander Keane so the commander King Trilogy provided the start of the company and we made these three games in three months from September 20th to December 14th 1990 when we released a commander King so it was a massive hit for us and it was so popular that people cosplayed as Keen for years at events and they still are so this game pioneered the creation of game engines so we designed the game as an engine that operated on different data for different games it was the only way that we could get this Trilogy done so quickly in fact in 1991 when we were working on Keen four we started licensing the engine for the first time and it was a beginning of this modern engine licensing business which today is dominated by unity and unreal so development on our games went very smoothly and quickly because we stuck to some core principles that are important even today so through this talk I'm going to highlight some of our core principles I'd also like to highlight something else namely this photo has anyone ever seen this photo before yeah I didn't think so it's hidden on the Internet it's a picture of us at our lake house in Shreveport Louisiana where we started in software so the funny thing is that people ask me for years uh you know game developers are asking like what is in this picture like what are all these things so I analyzed it recently and and here's what you see this is uh me and John in early September of 1990 we're working on the Super Mario 3 demo that we planned on sending to Nintendo we both worked on this huge Dungeons and Dragons table that John had um we used to play D D on the weekends and those sessions led to ideas for future games like doom and Quake actually so Tom Hall took this photo um the computers there were brought home from work on the weekends because we didn't have PCS so this photo was taken on a Saturday or a Sunday on top of the monitor is one of those Intel reflective astronaut plushies it was part of a marketing campaign back then probably don't remember that and to my left is a notepad which was like a task list of bugs to fix and then this is our high level task list which we had to get done to finish the demo uh and this is Tom Hall's area uh on the right where he was doing all the graphics for this demo he recorded gameplay um of Super Mario Brothers 3 on a VCR and he played it back and he's pausing the action so he could duplicate the tiles exactly in Deluxe paint too the TV set that he was playing it on had a 13 Channel selector on it and was connected by an RF modulator very old school so windsoftware was formally founded on February 1st of 1991 and we made 13 games that year uh Shadow nights dangerous Dave in the Haunted Mansion we you know all these games uh that you see here plus three other ones I think there are a few others that aren't not shown here for um the Apple II so we actually took two months for each game but we made two games at the same time at least two um and this was due to us having 10 years of intense game development experience prior but it was also due to one of our first principles which was no prototypes just make the game polish as you go do not depend on polish happening later always maintain constantly shippable code this is basically how we make games so quickly back then we knew what the game was we had it in our minds and we just needed to quantify what needed to be done and we went about working on it`
// const part3 = `until the game was finished there were no prototypes for our games we just made them but remember you know this is a small team of four people and we could do this in large teams obviously require planning and prototypes but that's what we that's what we did back then uh time for a quick story so one day it rained really hard in Shreveport uh in the Cross Lake which is where lake house was it was flooding everywhere and I really needed to get to work we were furiously working away on our games and I just had to get back to coding so I just got ready for work and drove down the street and this is what I saw the entire Road was just flooded for I couldn't even see the end of it well I waded through that that flood and water snakes and everything else that's coming out of that there was crocodiles out there too um all the way to the house and basically took another shower and I got back to work we were so excited to be making our own games in our own company 24 7. and also note that during this year of all these games we moved ID software from Louisiana to Wisconsin which does take a bit of time out of game development so we couldn't afford to have anything go wrong while we're making our games so you know at this crazy fast pace so we created another principle that kept us developing quickly uh it's incredibly important that your game can be run by your team all the time bulletproof your engine by providing defaults on load failure so if you have a hundred people developing a game and it won't run then you're paying for 100 people to sit around and wait for it to get fixed so we recognize the importance of making sure the game will always run and decided to just bulletproof our engine by making all input solid so game engines typically fail because they can't load they're loading bad corrupted or non-existent data and so checking for this and providing a default for failure will keep the game always running you know and also you got to make sure it's showing you what's missing so if you fail to load a Sprite basically show a bagel if the theme song is not loading play something really wrong and obnoxious uh Missing sound effect same thing so after 1991 in software's first stage of company development is complete and another important principle was in effect keep your code absolutely simple keep looking at your functions and figure out how you can simplify further we wrote all of our games all the way up to quake in C not C plus plus okay so stage two is about to begin in August of 1991 we decided to move to Madison Wisconsin Tom and I visited at that time and we found it to be really nice you know Tom used to live there while he was in college he grew up in Wisconsin so we moved all four of us up there and we started working on our games only four months later were found dead in the snow victims of Wisconsin's brutal Winters that we did not research and Tom did not tell us moral of the story do your research we knew how to program an assembly language but not how to ask Tom hey what are winters like up here so after six months of this garbage we moved down to Texas [Applause] so yeah so we have a new principal great tools help make great games uh spend as much time on tools as possible I wrote a tile editor back in 1991 named Ted title editor Ted was used for 33 shipped retail games several of which were actually 3D games like hovertank catacomb 3D Wolfenstein 3D Spear of Destiny rise the Triad Court Corridor seven and some others so it was January it's 1992. we decided to go all 3D based on catacomb 3D's promise so it's a game that we made um at the end of you know for October or November of 1991. it looked really cool it just didn't play really cool um so Wolfenstein 3D was a game that we made yeah Wolfenstein took four months of development to make the shareware version uh we made the shower version and then we launched the game with one episode of levels and it took us two more months to finish all six episodes and the handbook that goes with it in the first month it sold 4 000 copies all priced at 60 bucks each yeah math it's a spear of destiny took two months we made that right after Wolfenstein uh it's a prequel to Wolfenstein and it was retail only and soon after Tom Hall traveled to Kentucky to work for a couple months on Wolfenstein VR yes this is 1992 VR`
// const part4 = `so back in the days of Commander Keane I discovered a small three-person game company called raven software in Madison Wisconsin I called him up we went over we introduced ourselves to him Flash Forward seven months later and we did a little bit of work with them by modifying the Wolfenstein 3D engine and licensed it to them for a game called shadowcaster so shadowcaster's Tech improvements were sloping floors and lighting and fog and this engine looked better you know slightly better than Wolfenstein 3D but it just wasn't good enough for our next game so John Carmack spent some months thinking about how more advanced this next engine really should be for this game that we decided to call Doom and So based on the rapid development of our previous games we came up with another important principle we are our own best testing team and we should never allow anyone else to experience bugs or see the game Crash so don't waste others time test thoroughly before checking in your code no throwing it over the fence for testers to find and put in a bug database and fix it later it's really a wasteful cycle we didn't have QA back then we just did it so after 1992 it's off for a second stage of company development was complete along with another principle which is core to programming as soon as you see a bug you fix it you don't keep working if you don't fix your bugs your new coat will be built on buggy code and ensure an unstable foundation and if you check in buggy coat someone else is going to be writing code based on your bad code and well you know you can imagine how wasteful that's going to be so the the ideas for Doom came from our DND Campaign which was full of demons and we also really love the movie's Evil Dead and aliens Doom's design was really a mashup of ideas and at the beginning of Doom's development we created a new core principle are you ready for all these uh so use a development system that's Superior to your target to develop your game it's something that most and nobody did back then I mean before Doom we're making games for dos while developing on dos computers like of course why wouldn't you we knew that we could do better though if we use some powerful computers and a more advanced operating system to develop our games so we developed doom on Next Step workstations they were far superior to DOS Next Step eventually turned into OS 10 OS X whatever you want to call it this also meant that one of our core principles was upheld great tools helped make great games and we could make way better tools on next step so do med and Quake Ed were two of the most important tools that we had they both really helped us create levels and test them very quickly you might not have known this but we had five people on our team creating Doom so after Tom Hall left in the middle of Doom we hired Sandy Peterson and Dave Taylor which brought us up to six people unbelievably while making Doom we had to stop all production and we had to create the Super Nintendo Port of Wolfenstein 3D as fast as possible we had a contract with the Japanese company we asked a contractor to do the work they did nothing and then it would became a panic situation right in the middle of Doom so we just had to stop and learn the Super Nintendo learn the hardware we never had programmed a Super Nintendo before and we had to convert the graphics to its format the audio all that stuff so we were at Peak in software uh throughput at the time and it took us three weeks I mean we had to learn the hardware so then we jumped into making doom again so we uploaded the shareware version of Doom to the University of Wisconsin server on December 10th of 1993 and the excitement for the game was unprecedented people were creating files in the upload directory to that were sentences like when.will dot we see Doom right we were getting phone calls on our unlisted phone number asking when it was going to be out I don't know how people knew this anyway time for another quick story uh during the final day of Doom's creation we worked 30 hours we crammed as many hours as we could so we had the game running on all the computers in the office to ensure that it was solid you don't just burn in burn in that game however on a couple computers the game just froze the menu could pop up but the gameplay just stopped moving so John Carmack thought about what could possibly be happening`

// // console.time(`part1`)
// // const summary1 = await summarizeChunk(part1)
// // console.timeEnd(`part1`)
// // const summary2 = await summarizeChunk(part2)
// // const summary3 = await summarizeChunk(part3)
// // const summary4 = await summarizeChunk(part4)

// const summaryofsummary = await summarizeChunks([part1, part2, part3, part4])
// }

// main()
