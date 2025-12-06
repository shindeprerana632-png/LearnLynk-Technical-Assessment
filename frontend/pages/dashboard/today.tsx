import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface Task {
  id: string;
  task_type: string;
  application_id: string;
  due_at: string;
  status: string;
}

export default function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load today's tasks
  const fetchTodayTasks = async () => {
    setLoading(true);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .gte("due_at", today + "T00:00:00Z")
      .lte("due_at", today + "T23:59:59Z")
      .neq("status", "completed")
      .order("due_at", { ascending: true });

    if (error) {
      console.error("Error loading tasks:", error);
      setTasks([]);
    } else {
      setTasks(data || []);
    }

    setLoading(false);
  };

  // Mark task complete
  const markComplete = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return;
    }

    fetchTodayTasks(); // Refresh
  };

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  if (loading) return <p>Loading tasks...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tasks Due Today</h1>

      {tasks.length === 0 && (
        <p>No tasks due today 🎉</p>
      )}

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px",
          }}
        >
          <p><strong>Type:</strong> {task.task_type}</p>
          <p><strong>Application ID:</strong> {task.application_id}</p>
          <p><strong>Due At:</strong> {task.due_at}</p>
          <p><strong>Status:</strong> {task.status}</p>

          <button
            onClick={() => markComplete(task.id)}
            style={{
              marginTop: "10px",
              padding: "8px 14px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Mark Complete
          </button>
        </div>
      ))}
    </div>
  );
}
