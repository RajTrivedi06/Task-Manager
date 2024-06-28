import React from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../Styles/statusLine.css";
import Task from "./Tasks";

function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Task
        addTask={props.addTask}
        deleteTask={props.deleteTask}
        moveTask={props.moveTask}
        task={props.task}
      />
    </div>
  );
}

export default function StatusLine(props) {
  const { status, tasks, addTask, deleteTask, addEmptyTask, moveTask } = props;

  function handleAddEmpty() {
    addEmptyTask(status);
  }

  const tasksForStatus = tasks.filter((task) => task.status === status);

  return (
    <div className="statusLine">
      <h3>{status}</h3>
      <SortableContext items={tasksForStatus.map((task) => task.id)}>
        {tasksForStatus.map((task) => (
          <SortableItem
            key={task.id}
            task={task}
            addTask={addTask}
            deleteTask={deleteTask}
            moveTask={moveTask}
          />
        ))}
      </SortableContext>
      <button onClick={handleAddEmpty} className="button addTask">
        +
      </button>
    </div>
  );
}
