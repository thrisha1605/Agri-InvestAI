import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "@/lib/auth"
import {
addProgressUpdate,
fetchProjectProgress,
listProgress,
listProjects,
type ProjectProgressUpdate
} from "@/lib/appData"

import {
Calendar,
Clock3,
CloudRain,
Image as ImageIcon,
Send,
ThermometerSun
} from "lucide-react"
import { toast } from "sonner"

type MilestoneKey =
| "PLANTING"
| "IRRIGATION"
| "FERTILIZATION"
| "PEST_CONTROL"
| "HARVEST"

type MilestoneDefinition = {
key: MilestoneKey
label: string
aliases: string[]
}

const milestones: MilestoneDefinition[] = [
{ key: "PLANTING", label: "Planting", aliases: ["PLANTING", "SOWING_PLANTING"] },
{ key: "IRRIGATION", label: "Irrigation", aliases: ["IRRIGATION", "IRRIGATION_SETUP"] },
{ key: "FERTILIZATION", label: "Fertilization", aliases: ["FERTILIZATION"] },
{ key: "PEST_CONTROL", label: "Pest Control", aliases: ["PEST_CONTROL", "PEST_DISEASE_CONTROL"] },
{ key: "HARVEST", label: "Harvest", aliases: ["HARVEST", "HARVESTING"] }
]

const emptyDoneState: Record<MilestoneKey, boolean> = {
PLANTING: false,
IRRIGATION: false,
FERTILIZATION: false,
PEST_CONTROL: false,
HARVEST: false
}

function money(n: number) {
return n.toLocaleString("en-IN", {
style: "currency",
currency: "INR"
})
}

function normalizeMilestoneValue(value?: string) {
return String(value || "")
.trim()
.toUpperCase()
.replace(/[^A-Z0-9]+/g, "_")
}

function matchesMilestone(update: Partial<ProjectProgressUpdate>, milestone: MilestoneDefinition) {
const updateValues = [
update.milestoneKey,
update.stage,
update.title
].map(normalizeMilestoneValue)

return updateValues.some(value => milestone.aliases.includes(value))
}

function buildDoneState(updates: ProjectProgressUpdate[]) {
return milestones.reduce<Record<MilestoneKey, boolean>>((state, milestone) => {
state[milestone.key] = updates.some(update => matchesMilestone(update, milestone))
return state
}, { ...emptyDoneState })
}

function formatUpdateTitle(update: ProjectProgressUpdate) {
const milestone = milestones.find(item => matchesMilestone(update, item))

if (update.title?.trim()) {
return update.title
}

if (milestone) {
return milestone.label
}

return String(update.stage || "Update")
.replace(/_/g, " ")
.toLowerCase()
.replace(/\b\w/g, char => char.toUpperCase())
}

function readFileAsDataUrl(file: File) {
return new Promise<string>((resolve, reject) => {
const reader = new FileReader()

reader.onloadend = () => {
if (typeof reader.result === "string") {
resolve(reader.result)
return
}

reject(new Error("Unable to read the selected image."))
}

reader.onerror = () => {
reject(reader.error || new Error("Unable to read the selected image."))
}

reader.readAsDataURL(file)
})
}

export function ProjectProgress() {

const { id } = useParams()

const project = listProjects().find(p => p.id === id)
const currentUser = authService.getCurrentUser()
const fileInputRef = useRef<HTMLInputElement>(null)

const [progressUpdates, setProgressUpdates] = useState<ProjectProgressUpdate[]>(
() => listProgress(id || "")
)
const [selectedMilestone, setSelectedMilestone] = useState<MilestoneKey | null>(null)
const [expenses] = useState<{label:string,amount:number,date:string}[]>([])
const [updateText, setUpdateText] = useState("")

useEffect(() => {
let active = true
const projectId = id || ""

setProgressUpdates(listProgress(projectId))
setSelectedMilestone(null)

if (!projectId) {
return () => {
active = false
}
}

void fetchProjectProgress(projectId)
.then(items => {
if (active) {
setProgressUpdates(items)
}
})
.catch(() => undefined)

return () => {
active = false
}
}, [id])

const done = useMemo(
() => buildDoneState(progressUpdates),
[progressUpdates]
)

const milestonePhotos = useMemo(
() =>
milestones.reduce<Record<MilestoneKey, ProjectProgressUpdate[]>>((items, milestone) => {
items[milestone.key] = progressUpdates.filter(
update => Boolean(update.image) && matchesMilestone(update, milestone)
)
return items
}, {
PLANTING: [],
IRRIGATION: [],
FERTILIZATION: [],
PEST_CONTROL: [],
HARVEST: []
}),
[progressUpdates]
)

const budget = (project?.fundingGoal || 0) * 0.12

const totalExpenses = useMemo(
() => expenses.reduce((a,e)=>a+e.amount,0),
[expenses]
)

const completedMilestoneCount = useMemo(
() => Object.values(done).filter(Boolean).length,
[done]
)

const variance = budget - totalExpenses

if(!project){
return <div className="p-10 text-center">Project not found</div>
}

const postLocalProgressUpdate = (update: Partial<ProjectProgressUpdate>) => {
const created = addProgressUpdate({
farmerId: currentUser?.id || project.farmerId,
...update
})

setProgressUpdates(prev => [created, ...prev])
return created
}

const markDone = (milestone: MilestoneDefinition) => {

if (done[milestone.key]) {
return
}

const progressPercent =
((completedMilestoneCount + 1) / milestones.length) * 100

postLocalProgressUpdate({
projectId: project.id,
milestoneKey: milestone.key,
stage: milestone.key,
title: `${milestone.label} completed`,
progress: progressPercent,
notes: `${milestone.label} stage completed`
})

toast.success(`${milestone.label} marked complete`)
}

const postUpdate = () => {

if(!updateText.trim()) return

postLocalProgressUpdate({
projectId: project.id,
stage: "UPDATE",
title: "Investor update",
progress: (completedMilestoneCount / milestones.length) * 100,
notes: updateText.trim()
})

toast.success("Update posted to investors")

setUpdateText("")
}

const openPhotoPicker = (milestoneKey: MilestoneKey) => {
if (!done[milestoneKey]) {
toast.error("Mark the milestone as done before adding photos.")
return
}

setSelectedMilestone(milestoneKey)
if (fileInputRef.current) {
fileInputRef.current.value = ""
fileInputRef.current.click()
}
}

const handlePhotoSelection = async (event: ChangeEvent<HTMLInputElement>) => {
const files = Array.from(event.target.files || [])
const milestoneKey = selectedMilestone

event.target.value = ""

if (!milestoneKey || files.length === 0) {
setSelectedMilestone(null)
return
}

const milestone = milestones.find(item => item.key === milestoneKey)
if (!milestone) {
setSelectedMilestone(null)
return
}

try {
const images = await Promise.all(files.map(file => readFileAsDataUrl(file)))
const createdUpdates = images.map((image, index) =>
addProgressUpdate({
projectId: project.id,
farmerId: currentUser?.id || project.farmerId,
milestoneKey: milestone.key,
stage: milestone.key,
title: `${milestone.label} photo update`,
progress: (completedMilestoneCount / milestones.length) * 100,
notes: `Added progress photo for ${milestone.label}.`,
image,
proofName: files[index]?.name || `${milestone.label.toLowerCase()}-photo`
})
)

setProgressUpdates(prev => [...createdUpdates.reverse(), ...prev])
toast.success(
`${files.length} photo${files.length > 1 ? "s" : ""} added to ${milestone.label}`
)
} catch {
toast.error("We could not read that photo. Please try again.")
} finally {
setSelectedMilestone(null)
}
}

const expectedRevenue =
project.fundingGoal * (1 + project.expectedROI / 100)

const netProfit =
expectedRevenue - project.fundingGoal - totalExpenses

const platformFee = Math.max(0,netProfit) * 0.04

const distributable = Math.max(0,netProfit) - platformFee

return (

<div className="min-h-screen bg-gray-50 py-8">

<div className="container mx-auto max-w-7xl space-y-6 px-4">

<div>
<h1 className="text-2xl font-bold">Project Progress</h1>
<p className="text-gray-600">
{project.title} - {project.cropType} - {project.location}
</p>
</div>

<Card>
<CardHeader>
<CardTitle>Funding Progress</CardTitle>
</CardHeader>

<CardContent className="space-y-3">

<p>
{money(project.fundedAmount)} raised of {money(project.fundingGoal)}
</p>

<Progress
value={(project.fundedAmount / project.fundingGoal) * 100}
/>

</CardContent>
</Card>

<div className="grid gap-4 lg:grid-cols-3">

<Card className="lg:col-span-2">

<CardHeader>
<CardTitle className="flex items-center gap-2 text-lg">
<Clock3 className="h-5 w-5 text-green-600"/>
Milestone timeline
</CardTitle>
</CardHeader>

<CardContent className="space-y-3">

<input
ref={fileInputRef}
type="file"
accept="image/*"
multiple
className="hidden"
onChange={handlePhotoSelection}
/>

{milestones.map(m => {
const photos = milestonePhotos[m.key]
const isDone = done[m.key]

return (
<div
key={m.key}
className="space-y-4 rounded-lg border p-4"
>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

<div className="flex items-center gap-3">

<Badge variant={isDone ? "default":"outline"}>
{isDone ? "DONE":"PENDING"}
</Badge>

<div>
<div className="font-medium">{m.label}</div>
{photos.length > 0 && (
<p className="text-sm text-gray-500">
{photos.length} photo{photos.length > 1 ? "s" : ""} uploaded
</p>
)}
</div>

</div>

{!isDone && (
<Button size="sm" onClick={()=>markDone(m)}>
Mark done
</Button>
)}

{isDone && (
<Button size="sm" variant="outline" onClick={() => openPhotoPicker(m.key)}>
<ImageIcon className="mr-2 h-4 w-4"/>
Add photos
</Button>
)}

</div>

{photos.length > 0 && (
<div className="grid gap-3 sm:grid-cols-2">
{photos.map(photo => (
<div key={photo.id} className="overflow-hidden rounded-lg border bg-white">
<img
src={photo.image}
alt={photo.proofName || `${m.label} progress`}
className="h-36 w-full object-cover"
/>
<div className="space-y-1 p-3">
<p className="text-sm font-medium">
{photo.proofName || `${m.label} photo`}
</p>
<p className="text-xs text-gray-500">
{new Date(photo.createdAt).toLocaleDateString("en-IN")}
</p>
</div>
</div>
))}
</div>
)}

</div>
)
})}

</CardContent>
</Card>

<Card>

<CardHeader>
<CardTitle className="flex items-center gap-2 text-lg">
<CloudRain className="h-5 w-5 text-blue-600"/>
Weather
</CardTitle>
</CardHeader>

<CardContent className="space-y-3">

<div className="flex justify-between">
<div className="flex gap-2 text-gray-600">
<ThermometerSun className="h-4 w-4"/>
Temperature
</div>
<div className="font-semibold">28 C</div>
</div>

<div className="flex justify-between">
<div className="flex gap-2 text-gray-600">
<CloudRain className="h-4 w-4"/>
Rainfall
</div>
<div className="font-semibold">12 mm</div>
</div>

</CardContent>

</Card>

</div>

<Tabs defaultValue="updates">

<TabsList>
<TabsTrigger value="updates">Investor Updates</TabsTrigger>
<TabsTrigger value="expenses">Expenses</TabsTrigger>
<TabsTrigger value="settlement">Settlement</TabsTrigger>
</TabsList>

<TabsContent value="updates">

<Card>

<CardHeader>
<CardTitle>Post Update</CardTitle>
</CardHeader>

<CardContent className="space-y-3">

<Input
value={updateText}
onChange={(e)=>setUpdateText(e.target.value)}
placeholder="Write update for investors..."
/>

<Button onClick={postUpdate}>
<Send className="mr-2 h-4 w-4"/>
Post Update
</Button>

<Separator/>

{progressUpdates.map(update => (

<div key={update.id} className="space-y-3 rounded-lg border p-3">

<p className="font-semibold">{formatUpdateTitle(update)}</p>

<p className="text-sm">{update.notes}</p>

{update.image && (
<img
src={update.image}
alt={update.proofName || formatUpdateTitle(update)}
className="max-h-64 w-full rounded-lg object-cover"
/>
)}

<p className="text-xs text-gray-500">
{new Date(update.createdAt).toLocaleDateString("en-IN")}
</p>

</div>

))}

</CardContent>

</Card>

</TabsContent>

<TabsContent value="expenses">

<Card>

<CardHeader>
<CardTitle>Expense Tracking</CardTitle>
</CardHeader>

<CardContent className="space-y-4">

<div className="grid gap-4 md:grid-cols-3">

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Budget</div>
<div className="text-xl font-bold">{money(budget)}</div>
</div>

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Spent</div>
<div className="text-xl font-bold">{money(totalExpenses)}</div>
</div>

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Variance</div>
<div className="text-xl font-bold">{money(variance)}</div>
</div>

</div>

</CardContent>

</Card>

</TabsContent>

<TabsContent value="settlement">

<Card>

<CardHeader>
<CardTitle className="flex items-center gap-2 text-lg">
<Calendar className="h-5 w-5 text-green-600"/>
Expected Settlement
</CardTitle>
</CardHeader>

<CardContent className="grid gap-4 md:grid-cols-4">

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Expected revenue</div>
<div className="text-xl font-bold">{money(expectedRevenue)}</div>
</div>

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Net profit</div>
<div className="text-xl font-bold">{money(Math.max(0,netProfit))}</div>
</div>

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Platform fee (4%)</div>
<div className="text-xl font-bold">{money(platformFee)}</div>
</div>

<div className="rounded-lg border p-4">
<div className="text-sm text-gray-600">Distributable</div>
<div className="text-xl font-bold">{money(distributable)}</div>
</div>

</CardContent>

</Card>

</TabsContent>

</Tabs>

</div>
</div>

)
}
