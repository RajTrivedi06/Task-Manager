import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/App.css";
import StatusLine from "./StatusLine";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Task from "./Tasks"; // Ensure the Task component is imported

function App() {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch tasks from the json-server
  async function fetchTasks() {
    try {
      const response = await axios.get("http://localhost:5001/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  // Add a new empty task
  async function addEmptyTask(status) {
    const newTask = {
      title: "",
      description: "",
      urgency: "",
      status,
      isCollapsed: false,
    };

    try {
      const response = await axios.post("http://localhost:5001/tasks", newTask);
      setTasks([...tasks, response.data]);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }

  // Add or update a task
  async function addTask(taskToAdd) {
    try {
      if (taskToAdd.id) {
        await axios.put(
          `http://localhost:5001/tasks/${taskToAdd.id}`,
          taskToAdd
        );
      } else {
        const response = await axios.post(
          "http://localhost:5001/tasks",
          taskToAdd
        );
        taskToAdd.id = response.data.id;
      }
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  // Delete a task
  async function deleteTask(taskId) {
    try {
      await axios.delete(`http://localhost:5001/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  // Move a task to a new status
  async function moveTask(id, newStatus) {
    try {
      const taskToUpdate = tasks.find((task) => task.id === id);
      taskToUpdate.status = newStatus;
      await axios.put(`http://localhost:5001/tasks/${id}`, taskToUpdate);
      fetchTasks();
    } catch (error) {
      console.error("Error moving task:", error);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);

    if (active.id !== over.id) {
      const updatedTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(updatedTasks);
      saveTasksToLocalStorage(updatedTasks);
    } else if (
      active.data.current.sortable.containerId !==
      over.data.current.sortable.containerId
    ) {
      const updatedTasks = tasks.map((task) =>
        task.id === active.id
          ? { ...task, status: over.data.current.sortable.containerId }
          : task
      );
      setTasks(updatedTasks);
      await axios.put(`http://localhost:5001/tasks/${active.id}`, {
        ...tasks.find((task) => task.id === active.id),
        status: over.data.current.sortable.containerId,
      });
    }
    setActiveId(null);
  }

  function saveTasksToLocalStorage(updatedTasks) {
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  }

  return (
    <div className="App">
      <h1>Task Management</h1>
      <main>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="columns">
            <SortableContext
              items={tasks
                .filter((task) => task.status === "Backlog")
                .map((task) => task.id)}
            >
              <StatusLine
                tasks={tasks}
                addEmptyTask={addEmptyTask}
                addTask={addTask}
                deleteTask={deleteTask}
                moveTask={moveTask}
                status="Backlog"
              />
            </SortableContext>
            <SortableContext
              items={tasks
                .filter((task) => task.status === "In Progress")
                .map((task) => task.id)}
            >
              <StatusLine
                tasks={tasks}
                addEmptyTask={addEmptyTask}
                addTask={addTask}
                deleteTask={deleteTask}
                moveTask={moveTask}
                status="In Progress"
              />
            </SortableContext>
            <SortableContext
              items={tasks
                .filter((task) => task.status === "Done")
                .map((task) => task.id)}
            >
              <StatusLine
                tasks={tasks}
                addEmptyTask={addEmptyTask}
                addTask={addTask}
                deleteTask={deleteTask}
                moveTask={moveTask}
                status="Done"
              />
            </SortableContext>
          </section>
          <DragOverlay>
            {activeId ? (
              <Task task={tasks.find((task) => task.id === activeId)} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}

export default App;
