import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, Week } from "@/types/habitica";
import {createTask, fetchTasks, scoreTask} from "@/services/habiticaApi";
import { toast } from "@/hooks/use-toast";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";

interface TaskListProps {
  onTaskScored: () => void;
}

function isRelevantForToday(task: Task): boolean {
  if (task.frequency === "daily") return true;
  if (task.frequency === "weekly" && task.repeat) {
    const dayMap: Record<number, keyof Week> = {
      0: "su",
      1: "m",
      2: "t",
      3: "w",
      4: "th",
      5: "f",
      6: "s",
    };
    const todayKey = dayMap[new Date().getDay()];
    return task.repeat[todayKey];
  }
  return false;
}

export const TaskList = ({ onTaskScored }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoredTaskIds, setScoredTaskIds] = useState<Set<string>>(new Set());
  const [scoringTaskIds, setScoringTaskIds] = useState<Set<string>>(new Set());
  const [taskName, setTaskName] = useState<string>("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const allTasks = await fetchTasks();
      const dailyTasks = allTasks.filter((t) => t.type === "daily");
      setTasks(dailyTasks);
    } catch (error) {
      toast({
        title: "Error loading tasks",
        description: "Failed to fetch tasks from Habitica.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async (task: Task) => {
    setScoringTaskIds((prev) => new Set(prev).add(task.id));
    try {
      await scoreTask(task.id);
      setScoredTaskIds((prev) => new Set(prev).add(task.id));
      toast({
        title: "Task scored!",
        description: `Completed "${task.text}"`,
      });
      onTaskScored();
    } catch (error) {
      toast({
        title: "Failed to score task",
        description: `Could not complete "${task.text}".`,
        variant: "destructive",
      });
    } finally {
      setScoringTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleCreateTask = async () => {
    setLoading(true);
    try {
      await createTask(taskName);
      toast({
        title: "Task created!",
        description: `Created task "${taskName}".`,
      })
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: `Could not create task "${taskName}".`,
        variant: "destructive"
      });
    } finally {
      setTaskName("");
      await loadTasks();
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">Loading tasks...</p>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-sm">No daily tasks found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold mb-4">Daily Tasks</h2>
      <div className="flex items-center gap-3">
        <Label htmlFor="task">
          Task
        </Label>
        <Input
            id="iterations"
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        />
        <Button onClick={handleCreateTask}>Create</Button>
      </div>
      {tasks.map((task) => {
        const relevant = isRelevantForToday(task);
        const isCompleted = task.completed || scoredTaskIds.has(task.id);
        const isScoring = scoringTaskIds.has(task.id);

        return (
          <Card
            key={task.id}
            className={`p-4 flex items-center gap-3 ${!relevant ? "opacity-50" : ""}`}
          >
            <Checkbox
              checked={isCompleted}
              disabled={isCompleted || isScoring}
              onCheckedChange={() => handleScore(task)}
            />
            <span className={`text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {task.text}
            </span>
          </Card>
        );
      })}
    </div>
  );
};
