let config = {};
let editingTaskId = null;

async function loadConfig() {
  try {
    const res = await fetch('config.json');
    if (!res.ok) throw new Error('Failed to load config.json');
    config = await res.json();
    fetchTasks();
  } catch (err) {
    showStatus('Error loading configuration: ' + err.message);
  }
}

function showStatus(msg) {
  document.getElementById('status-message').textContent = msg;
}

function clearStatus() {
  document.getElementById('status-message').textContent = '';
}

function getHeaders() {
  return {
    'apikey': config.supabasePublishableKey,
    'Authorization': `Bearer ${config.supabasePublishableKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function fetchTasks() {
  clearStatus();
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?select=*`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    showStatus('Failed to fetch tasks: ' + err.message);
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('task-list');
  container.innerHTML = '';

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.setAttribute('data-id', task.id);

    const titleEl = document.createElement('h3');
    titleEl.className = 'task-title';
    titleEl.textContent = task.title;
    if (task.completed) titleEl.classList.add('completed');

    const descEl = document.createElement('p');
    descEl.className = 'task-description';
    descEl.textContent = task.description || '';

    const statusEl = document.createElement('p');
    statusEl.className = 'task-status';
    statusEl.textContent = task.completed ? 'Status: Completed' : 'Status: Incomplete';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-task';
    toggleBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Completed';
    toggleBtn.onclick = () => toggleTask(task);

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-task';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => startEdit(task);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteTask(task.id);

    div.append(titleEl, descEl, statusEl, toggleBtn, editBtn, deleteBtn);
    container.appendChild(div);
  });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearStatus();

  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;

  try {
    if (editingTaskId) {
      const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${editingTaskId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ title, description })
      });
      if (!res.ok) throw new Error('Failed to update task');
      editingTaskId = null;
    } else {
      const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, description, completed: false })
      });
      if (!res.ok) throw new Error('Failed to create task');
    }

    document.getElementById('task-form').reset();
    fetchTasks();
  } catch (err) {
    showStatus('Operation failed: ' + err.message);
  }
});

function startEdit(task) {
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description || '';
  editingTaskId = task.id;
}

async function toggleTask(task) {
  clearStatus();
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${task.id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completed: !task.completed })
    });
    if (!res.ok) throw new Error('Failed to toggle status');
    fetchTasks();
  } catch (err) {
    showStatus('Failed to toggle status: ' + err.message);
  }
}

async function deleteTask(id) {
  clearStatus();
  try {
    const res = await fetch(`${config.supabaseUrl}/rest/v1/${config.tableName}?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete task');
    fetchTasks();
  } catch (err) {
    showStatus('Failed to delete task: ' + err.message);
  }
}

window.onload = loadConfig;
