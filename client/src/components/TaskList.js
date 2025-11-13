import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function TaskList({ employeeName }) {
  const [tasks, setTasks] = useState([]);
  const [dueProjects, setDueProjects] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchDueProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchDueProjects = async () => {
    try {
      const response = await axios.get('/api/projects/due');
      setDueProjects(response.data);
    } catch (error) {
      console.error('Error fetching due projects:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      await axios.post('/api/tasks', {
        taskName: newTaskName,
        description: newTaskDescription,
        createdBy: employeeName
      });
      setNewTaskName('');
      setNewTaskDescription('');
      setShowAddForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        completed: !currentStatus
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditName(task.task_name);
    setEditDescription(task.description || '');
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditName('');
    setEditDescription('');
  };

  const handleUpdateTask = async (taskId) => {
    if (!editName.trim()) return;

    try {
      await axios.put(`/api/tasks/${taskId}`, {
        taskName: editName,
        description: editDescription
      });
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Only allow reordering within incomplete tasks
    const reorderedIncompleteTasks = Array.from(incompleteTasks);
    const [removed] = reorderedIncompleteTasks.splice(sourceIndex, 1);
    reorderedIncompleteTasks.splice(destIndex, 0, removed);

    // Update local state immediately for smooth UX
    const updatedTasks = [...reorderedIncompleteTasks, ...completedTasks];
    setTasks(updatedTasks);

    // Send update to server
    try {
      await axios.put('/api/tasks/reorder', {
        tasks: reorderedIncompleteTasks.map(task => ({ id: task.id }))
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      fetchTasks(); // Revert on error
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  const handleToggleProjectComplete = async (projectId, currentStatus) => {
    try {
      await axios.patch(`/api/projects/${projectId}`, {
        completed: !currentStatus
      });
      fetchDueProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const isOverdue = (dueDate) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  const isDueToday = (dueDate) => {
    const today = new Date().toISOString().split('T')[0];
    return dueDate === today;
  };

  return (
    <div className="task-list">
      <div className="task-header">
        <h2>Daily Tasks</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-add"
        >
          {showAddForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="progress-bar-container">
          <div className="progress-label">
            <span>Progress</span>
            <span>{completedTasks.length} / {tasks.length} completed</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {dueProjects.length > 0 && (
        <div className="due-projects-section">
          <h3 className="due-projects-header">
            ⚠️ Projects Due Today or Overdue
          </h3>
          {dueProjects.map(project => (
            <div
              key={`project-${project.id}`}
              className={`task-item project-task ${
                isOverdue(project.due_date) ? 'overdue' : 'due-today'
              }`}
            >
              <div className="task-content">
                <input
                  type="checkbox"
                  checked={project.completed}
                  onChange={() => handleToggleProjectComplete(project.id, project.completed)}
                  className="task-checkbox"
                />
                <div className="task-details">
                  <div className="task-name">
                    {project.project_name}
                    <span className="client-badge-small">{project.client_name}</span>
                    <span className={`due-badge ${isOverdue(project.due_date) ? 'overdue' : 'today'}`}>
                      {isOverdue(project.due_date) ? '🔴 Overdue' : '📅 Due Today'}
                    </span>
                  </div>
                  {project.description && (
                    <div className="task-description">{project.description}</div>
                  )}
                  <div className="project-due-date">
                    Due: {new Date(project.due_date + 'T00:00:00').toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            placeholder="Task name"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className="input"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newTaskDescription}
            onChange={(e) => setNewTaskDescription(e.target.value)}
            className="input textarea"
            rows="2"
          />
          <button type="submit" className="btn btn-primary">
            Add Task
          </button>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="tasks-container">
          {incompleteTasks.length === 0 && completedTasks.length === 0 && (
            <div className="empty-state">
              <p>No tasks for today. Add your first task to get started!</p>
            </div>
          )}

          <Droppable droppableId="incomplete-tasks">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={snapshot.isDraggingOver ? 'dragging-over' : ''}
              >
                {incompleteTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`task-item ${task.is_default === 1 ? 'task-default' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="task-content">
                          <div className="drag-handle">⋮⋮</div>
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleComplete(task.id, task.completed)}
                            className="task-checkbox"
                          />
                          <div className="task-details">
                            <div className="task-name">
                              {task.task_name}
                              {task.is_default === 1 && <span className="default-badge">Daily</span>}
                              {task.created_by && <span className="created-by-badge">by {task.created_by}</span>}
                            </div>
                            {task.description && (
                              <div className="task-description">{task.description}</div>
                            )}
                          </div>
                        </div>
                        {task.is_default !== 1 && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="btn-delete"
                            title="Delete task"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

        {completedTasks.length > 0 && (
          <>
            <div className="completed-divider">
              <span>Completed</span>
            </div>
            {completedTasks.map(task => (
              <div key={task.id} className={`task-item task-completed ${task.is_default === 1 ? 'task-default' : ''}`}>
                <div className="task-content">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleToggleComplete(task.id, task.completed)}
                    className="task-checkbox"
                  />
                  <div className="task-details">
                    <div className="task-name">
                      {task.task_name}
                      {task.is_default === 1 && <span className="default-badge">Daily</span>}
                      {task.created_by && <span className="created-by-badge">by {task.created_by}</span>}
                    </div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                  </div>
                </div>
                {task.is_default !== 1 && (
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn-delete"
                    title="Delete task"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </>
        )}
        </div>
      </DragDropContext>
    </div>
  );
}

export default TaskList;
