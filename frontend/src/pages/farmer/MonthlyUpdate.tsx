import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MonthlyUpdate(){

const [progress,setProgress] = useState(0);
const [notes,setNotes] = useState("");

const submitUpdate = () => {

console.log({
progress,
notes,
date:new Date()
});

};

return(

<div className="container mx-auto py-8 max-w-xl">

<h1 className="text-2xl font-bold mb-6">
Monthly Project Update
</h1>

<input
type="number"
placeholder="Progress %"
className="border p-2 w-full mb-4"
onChange={e=>setProgress(Number(e.target.value))}
/>

<textarea
placeholder="Update notes"
className="border p-2 w-full mb-4"
onChange={e=>setNotes(e.target.value)}
/>

<Button onClick={submitUpdate}>
Submit Update
</Button>

</div>

);

}