import { useState, useEffect, useMemo } from 'react'
import {
  ChevronRight,
  Plus,
  Trash2,
  Bell,
  X,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  Circle,
} from 'lucide-react'


interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface Task {
  id: string
  title: string
  startTime: string
  endTime: string
  completed: boolean
  subtasks: Subtask[]
}

const fuzzyMatch = (text: string, query: string): boolean => {
  const t = text.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return true
  let cursor = 0
  for (const char of t) {
    if (cursor < q.length && char === q[cursor]) cursor++
    if (cursor === q.length) return true
  }
  return cursor === q.length
}

const timeString = (date: Date = new Date()) => date.toTimeString().slice(0, 5)


export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])

  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskStartTime, setNewTaskStartTime] = useState('')
  const [newTaskEndTime, setNewTaskEndTime] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [subtaskInput, setSubtaskInput] = useState('')

  const [dismissed, setDismissed] = useState(false)

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') return true
    if (stored === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const timer = setTimeout(() => setCurrentDate(new Date()), 1000)
    return () => clearTimeout(timer)
  }, [currentDate])

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const completedCount = tasks.filter(task => task.completed).length
  const undoneCount = tasks.length - completedCount
  const allDone = tasks.length > 0 && completedCount === tasks.length
  const showCelebration = allDone && !dismissed

  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      fuzzyMatch(task.title, searchQuery) ||
      task.subtasks.some(st => fuzzyMatch(st.title, searchQuery))
    )
  }, [tasks, searchQuery])

  const toggleTask = (id: string) => {
    const nextTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    )
    setTasks(nextTasks)
    const newAllDone = nextTasks.length > 0 && nextTasks.every(t => t.completed)
    if (!newAllDone) setDismissed(false)
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    const now = new Date()
    const defaultStart = timeString(now)
    const defaultEnd = timeString(new Date(now.getTime() + 60 * 60 * 1000))
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      startTime: newTaskStartTime || defaultStart,
      endTime: newTaskEndTime || defaultEnd,
      completed: false,
      subtasks: [],
    }
    setTasks([...tasks, newTask])
    setNewTaskTitle('')
    setNewTaskStartTime('')
    setNewTaskEndTime('')
    setShowAddForm(false)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id))
    setDismissed(false)
  }

  const toggleExpand = (id: string) => {
    setExpandedTask(expandedTask === id ? null : id)
    setSubtaskInput('')
  }

  const addSubtask = (taskId: string) => {
    if (!subtaskInput.trim()) return
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: [
              ...task.subtasks,
              { id: `${taskId}-${Date.now()}`, title: subtaskInput, completed: false },
            ],
          }
        : task
    ))
    setSubtaskInput('')
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: task.subtasks.map(st =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ),
          }
        : task
    ))
  }

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, subtasks: task.subtasks.filter(st => st.id !== subtaskId) }
        : task
    ))
  }

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const visibleCount = filteredTasks.length

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-top">
            <button className="header-btn" onClick={toggleDarkMode} aria-label="Toggle dark mode">
              {darkMode ? <Sun /> : <Moon />}
            </button>
            <div className="header-date">
              <span>{formatDate(currentDate)}</span>
              <span className="header-time">{formatTime(currentDate)}</span>
            </div>
            <button className="header-btn" aria-label="Notifications">
              <Bell />
              {undoneCount > 0 && <span className="notification-badge">{undoneCount}</span>}
            </button>
          </div>

          <div className="header-title">
            <h1>Nudge</h1>
            <p>{tasks.length} tasks</p>
          </div>

          <div className="header-cards">
            <div className="tasks-card">
              <div className="tasks-card-number">{tasks.length}</div>
              <div className="tasks-card-label">Tasks</div>
            </div>
          </div>

          <div className="task-stats">
            <div className="stat-item done">
              <span className="stat-number">{completedCount}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-item undone">
              <span className="stat-number">{undoneCount}</span>
              <span className="stat-label">Undone</span>
            </div>
          </div>

          {showAddForm ? (
            <form
              className="add-task-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleAddTask()
              }}
            >
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="add-task-input"
              />
              <div className="add-task-time-inputs">
                <input
                  type="time"
                  value={newTaskStartTime}
                  onChange={(e) => setNewTaskStartTime(e.target.value)}
                  className="add-task-time"
                />
                <input
                  type="time"
                  value={newTaskEndTime}
                  onChange={(e) => setNewTaskEndTime(e.target.value)}
                  className="add-task-time"
                />
              </div>
              <div className="add-task-actions">
                <button type="submit" className="add-task-submit">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="add-task-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="add-new-btn"
            >
              <Plus size={20} />
              Add New
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-section">
        <div className="tasks-container">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="tasks-search-count">{visibleCount} of {tasks.length} tasks shown</div>

          {/* Vertical timeline line */}
          <div className="timeline-line"></div>

          {/* Tasks */}
          <ul className="tasks-list">
            {filteredTasks.map((task, index) => (
              <li key={task.id} className="task-item">
                {/* Time label */}
                <div className="task-time">{task.startTime}</div>

                {/* Timeline dot */}
                <div className="timeline-dot"></div>

                {/* Task card */}
                <div
                  className={`task-card ${task.completed ? 'completed' : ''} ${
                    index === 1 ? 'highlighted' : ''
                  }`}
                >
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="task-checkbox"
                    />

                    <div className="task-info">
                      <h3 className={`task-title ${task.completed ? 'completed' : ''}`}>
                        {task.title}
                      </h3>
                      {(task.startTime || task.endTime) && (
                        <p className="task-time-range">
                          {task.startTime} — {task.endTime}
                        </p>
                      )}
                      {task.subtasks.length > 0 && (
                        <div className="subtask-summary">
                          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                        </div>
                      )}
                    </div>

                    <div className="task-actions">
                      <button
                        className={`task-nav-btn ${expandedTask === task.id ? 'expanded' : ''}`}
                        onClick={() => toggleExpand(task.id)}
                      >
                        <ChevronRight />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="task-delete-btn"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>

                  {expandedTask === task.id && (
                    <div className="subtask-list">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="subtask-item">
                          <button
                            className="subtask-checkbox"
                            onClick={() => toggleSubtask(task.id, subtask.id)}
                            aria-label={subtask.completed ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {subtask.completed ? <CheckCircle2 /> : <Circle />}
                          </button>
                          <span className={`subtask-title ${subtask.completed ? 'completed' : ''}`}>
                            {subtask.title}
                          </span>
                          <button
                            className="subtask-delete"
                            onClick={() => deleteSubtask(task.id, subtask.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      <form
                        className="subtask-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          addSubtask(task.id)
                        }}
                      >
                        <input
                          type="text"
                          value={subtaskInput}
                          onChange={(e) => setSubtaskInput(e.target.value)}
                          placeholder="Add a subtask..."
                          className="subtask-input"
                        />
                        <button type="submit" className="subtask-add" aria-label="Add subtask">
                          <Plus size={14} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {visibleCount === 0 && tasks.length > 0 && (
            <div className="empty-search">
              <Search size={32} />
              <p>No tasks match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {showCelebration && (
        <div className="celebration-overlay">
          <div className="confetti">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{ animationDelay: `${(i * 73) % 2000}ms` }}
              />
            ))}
          </div>
          <div className="celebration-content">
            <div className="party-popper"></div>
            <h2 className="celebration-title">All Done!</h2>
            <p className="celebration-text">You completed all your tasks.</p>
            <button
              onClick={() => setDismissed(true)}
              className="celebration-close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
