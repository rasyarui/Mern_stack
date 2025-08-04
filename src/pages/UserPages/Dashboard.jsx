import React, { useEffect, useState, useRef } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserSidebar from "./UserSidebar";
import Column from "./Column";
import SortableItem from "./SortableItem";
import notificationSound from "./notification.mp3";

const UserDashboard = () => {
  const [tasks, setTasks] = useState({
    "To Do": [],
    "In Progress": [],
    Completed: [],
  });

  const [notes, setNotes] = useState(localStorage.getItem("notes") || "");
  const audioRef = useRef(new Audio(notificationSound));
  const [searchQuery, setSearchQuery] = useState("");
  const [completionStatus, setCompletionStatus] = useState("all");

  // 🔹 Ensure page starts from top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const filteredTasks = storedTasks.filter(task => {
      const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (completionStatus === 'all') {
        return searchMatch;
      } else if (completionStatus === 'completed') {
        return searchMatch && task.progress > 80;
      } else if (completionStatus === 'incomplete') {
        return searchMatch && task.progress <= 80;
      }
      return searchMatch;
    });

    const categorizedTasks = {
      "To Do": filteredTasks.filter((task) => task.progress <= 40),
      "In Progress": filteredTasks.filter((task) => task.progress > 40 && task.progress <= 80),
      Completed: filteredTasks.filter((task) => task.progress > 80),
    };
    setTasks(categorizedTasks);
    checkDeadlines(storedTasks);
  }, [searchQuery, completionStatus]);

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  const checkDeadlines = (tasks) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    tasks.forEach((task) => {
      if (task.deadline === today) {
        showNotification(`🚨 Task Due Today: "${task.title}"`, "bg-red-500 text-white");
      } else if (task.deadline === tomorrowStr) {
        showNotification(`⏳ Task Due Tomorrow: "${task.title}"`, "bg-yellow-500 text-black");
      }
    });
  };

  const showNotification = (message, bgClass) => {
    toast(
      <div className={`p-2 rounded-lg shadow-md font-semibold text-lg ${bgClass}`}>
        {message}
      </div>,
      { position: "top-right", autoClose: 5000, hideProgressBar: false }
    );
    audioRef.current.play();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceColumn = Object.keys(tasks).find((column) =>
      tasks[column].some((task) => task.id === active.id)
    );
    const targetColumn = Object.keys(tasks).find((column) => tasks[column].some((task) => task.id === over.id)) || over.id;

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };
      const movedTask = updatedTasks[sourceColumn].find((task) => task.id === active.id);
      updatedTasks[sourceColumn] = updatedTasks[sourceColumn].filter((task) => task.id !== active.id);
      updatedTasks[targetColumn] = [...(updatedTasks[targetColumn] || []), movedTask];

      return updatedTasks;
    });

    localStorage.setItem("tasks", JSON.stringify([...tasks["To Do"], ...tasks["In Progress"], ...tasks["Completed"]]));
  };

  // Task Analytics Chart Data (Bar Graph)
  const chartData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        label: "Number of Tasks",
        data: [
          tasks["To Do"].length,
          tasks["In Progress"].length,
          tasks.Completed.length,
        ],
        backgroundColor: ["#FF6384", "#FFCE56", "#36A2EB"],
      },
    ],
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          🚀 User Dashboard
        </h2>
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar />

        {/* Filter and Search Section */}
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative w-full sm:w-1/2">
            <select
              value={completionStatus}
              onChange={(e) => setCompletionStatus(e.target.value)}
              className="w-full p-3 border rounded-lg shadow-sm appearance-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="all">All Tasks</option>
              <option value="incomplete">Incomplete</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="glassmorphism p-4 rounded-xl shadow-lg bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg border border-white/20">
          <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(tasks).map((columnKey) => (
                <Column key={columnKey} title={columnKey} id={columnKey} className="w-[280px]">
                  <SortableContext items={tasks[columnKey].map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {tasks[columnKey].map((task) => (
                      <SortableItem key={task.id} id={task.id} task={task} />
                    ))}
                  </SortableContext>
                </Column>
              ))}
            </div>
          </DndContext>
        </div>

        {/* Task Analytics & Notes Section */}
        <div className="mt-10 flex flex-col lg:flex-row items-start gap-6">
          {/* Task Analytics Chart */}
          <div className="p-6 w-full lg:w-1/2 bg-white shadow-lg rounded-xl border border-gray-300">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 text-center tracking-wide uppercase">
              📊 Task Analytics
            </h2>
            <Bar data={chartData} />
          </div>

          {/* Notes */}
          <div className="p-6 w-full lg:w-[590px] bg-green-900 text-white rounded-xl border-[12px] border-[#8B4501] shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">📌 Notes</h2>

            {/* Notes Input Field - Enlarged to match Task Analytics */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none text-white text-lg p-7"
              placeholder="Write your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              style={{
                fontFamily: "Chalkduster, Comic Sans MS, cursive",
                height: "320px",
                minHeight: "280px",
                textAlign: "left",
                resize: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
