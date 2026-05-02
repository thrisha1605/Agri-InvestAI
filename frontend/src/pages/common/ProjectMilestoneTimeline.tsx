import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { fetchProjectProgress, listProgress, type ProjectProgressUpdate } from "@/lib/appData";

type MilestoneDefinition = {
  key: string;
  label: string;
  aliases: string[];
};

const milestones: MilestoneDefinition[] = [
  { key: "PLANTING", label: "Planting", aliases: ["PLANTING", "SOWING_PLANTING"] },
  { key: "IRRIGATION", label: "Irrigation", aliases: ["IRRIGATION", "IRRIGATION_SETUP"] },
  { key: "FERTILIZATION", label: "Fertilization", aliases: ["FERTILIZATION"] },
  { key: "PEST_CONTROL", label: "Pest Control", aliases: ["PEST_CONTROL", "PEST_DISEASE_CONTROL"] },
  { key: "HARVEST", label: "Harvest", aliases: ["HARVEST", "HARVESTING"] },
];

function normalizeMilestoneValue(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");
}

function matchesMilestone(update: ProjectProgressUpdate, milestone: MilestoneDefinition) {
  return [update.milestoneKey, update.stage, update.title]
    .map(normalizeMilestoneValue)
    .some((value) => milestone.aliases.includes(value));
}

export function ProjectMilestoneTimeline() {
  const { id } = useParams();
  const projectId = id || "";
  const [updates, setUpdates] = useState<ProjectProgressUpdate[]>(() => listProgress(projectId));

  useEffect(() => {
    let active = true;

    setUpdates(listProgress(projectId));
    if (!projectId) {
      return () => {
        active = false;
      };
    }

    void fetchProjectProgress(projectId)
      .then((items) => {
        if (active) {
          setUpdates(items);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [projectId]);

  const milestoneCards = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        update: updates.find((item) => matchesMilestone(item, milestone)),
      })),
    [updates]
  );

  if (!id) return null;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">
        Project Milestones
      </h1>

      {milestoneCards.map(({ key, label, update }) => {

        return (

          <Card key={key}>

            <CardContent className="p-6">

              <div className="flex justify-between mb-4">

                <h2 className="font-semibold text-lg">
                  {label}
                </h2>

                <span className={`text-sm ${
                  update ? "text-green-600" : "text-gray-400"
                }`}>
                  {update ? "Completed" : "Pending"}
                </span>

              </div>

              {update && (

                <div className="space-y-3">

                  <p className="text-gray-700">
                    {update.notes}
                  </p>

                  {update.image && (

                    <img
                      src={update.image}
                      alt={update.proofName || `${label} proof`}
                      className="rounded-lg w-full max-h-72 object-cover"
                    />

                  )}

                  <p className="text-xs text-gray-500">
                    {new Date(update.createdAt).toLocaleDateString()}
                  </p>

                </div>

              )}

            </CardContent>

          </Card>

        );

      })}

    </div>
  );
}
