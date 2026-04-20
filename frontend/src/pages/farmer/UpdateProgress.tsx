import { useParams } from "react-router-dom"
import { useState } from "react"
import { addProgressUpdate } from "@/lib/appData"
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function UpdateProgress(){

const { projectId } = useParams()

const [stage,setStage] = useState("")
const [progress,setProgress] = useState(0)
const [notes,setNotes] = useState("")

const submit = () => {

addProgressUpdate({
projectId: projectId!,
stage,
progress,
notes
})

alert("Progress updated")

}

return(

<div className="container mx-auto max-w-xl py-10">

<Card>

<CardHeader>
<CardTitle>Update Farm Progress</CardTitle>
</CardHeader>

<CardContent className="space-y-4">

<select
className="border p-2 w-full"
value={stage}
onChange={(e)=>setStage(e.target.value)}
>

<option value="">Select Stage</option>

<option value="LAND_PREPARATION">LAND_PREPARATION</option>

<option value="SEED_SELECTION">SEED_SELECTION</option>

<option value="SOWING_PLANTING">SOWING_PLANTING</option>

<option value="IRRIGATION">IRRIGATION</option>

<option value="FERTILIZING">FERTILIZING</option>

<option value="PEST_DISEASE_CONTROL">PEST_DISEASE_CONTROL</option>

<option value="CROP_GROWTH">CROP_GROWTH</option>

<option value="HARVESTING">HARVESTING</option>

<option value="STORAGE_DISTRIBUTION">STORAGE_DISTRIBUTION</option>

<option value="COMPLETED">COMPLETED</option>

</select>

<input
type="number"
placeholder="Progress %"
className="border p-2 w-full"
value={progress}
onChange={(e)=>setProgress(Number(e.target.value))}
/>

<textarea
placeholder="Notes"
className="border p-2 w-full"
value={notes}
onChange={(e)=>setNotes(e.target.value)}
/>

<Button onClick={submit}>
Update Progress
</Button>

</CardContent>

</Card>

</div>

)
}