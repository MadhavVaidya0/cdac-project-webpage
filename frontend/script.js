const API_URL = "http://192.168.10.130:3000";

// Load todos on page load
window.onload = loadTodos;

function loadTodos() {
  fetch(`${API_URL}/todos`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("taskList");
      list.innerHTML = "";
      data.forEach(todo => addTaskToUI(todo));
    });
}

function addTask() {
  const input = document.getElementById("taskInput");
  const taskText = input.value.trim();
  if (taskText === "") return;

  fetch(`${API_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task: taskText })
  })
    .then(res => res.json())
    .then(todo => {
      addTaskToUI(todo);
      input.value = "";
    });
}

function addTaskToUI(todo) {
  const li = document.createElement("li");
  li.innerHTML = `
    ${todo.task}
    <button onclick="deleteTask(${todo.id}, this)">❌</button>
  `;
  document.getElementById("taskList").appendChild(li);
}

function deleteTask(id, btn) {
  fetch(`${API_URL}/todos/${id}`, { method: "DELETE" })
    .then(() => {
      btn.parentElement.remove();
    });
}

