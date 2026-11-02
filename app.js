"use strict";
// ================== State ==================
const STORAGE_KEY = "my-tasks";
let todos = loadTodos();
let currentFilter = "all";
let newestId = null; // only the newest task gets the "pop in" animation
// ================== DOM elements ==================
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyBox = document.getElementById("empty");
const emptyText = document.getElementById("empty-text");
const countEl = document.getElementById("count");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const dateEl = document.getElementById("date");
const filterButtons = document.querySelectorAll(".filter");
const clearDoneBtn = document.getElementById("clear-done");
const clearAllBtn = document.getElementById("clear-all");
// Small check-mark graphic used inside each checkbox
const CHECK_SVG = `
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8.5l3 3 7-7" stroke="#fff" stroke-width="2.5" fill="none"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
// ================== Storage ==================
function loadTodos() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch (_a) {
        return [];
    }
}
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
    catch (_a) {
        /* storage not available — app still works in memory */
    }
}
// ================== Actions ==================
function addTodo(text) {
    const clean = text.trim();
    if (!clean)
        return;
    const id = Date.now();
    todos.push({ id, text: clean, done: false });
    newestId = id;
    update();
}
function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (todo)
        todo.done = !todo.done;
    update();
}
function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    update();
}
function editTodo(id, newText) {
    const clean = newText.trim();
    if (!clean) {
        deleteTodo(id); // saving empty text removes the task
        return;
    }
    const todo = todos.find((t) => t.id === id);
    if (todo)
        todo.text = clean;
    update();
}
// Save + redraw after every change
function update() {
    saveTodos();
    render();
}
// ================== Rendering ==================
function visibleTodos() {
    if (currentFilter === "active")
        return todos.filter((t) => !t.done);
    if (currentFilter === "completed")
        return todos.filter((t) => t.done);
    return todos;
}
function createItem(todo) {
    const li = document.createElement("li");
    li.className = "item" + (todo.done ? " done" : "") + (todo.id === newestId ? " new" : "");
    // Checkbox
    const check = document.createElement("button");
    check.className = "check";
    check.innerHTML = CHECK_SVG;
    check.setAttribute("aria-label", todo.done ? "Mark as not done" : "Mark as done");
    check.addEventListener("click", () => toggleTodo(todo.id));
    // Text (textContent keeps user input safe from HTML injection)
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;
    text.addEventListener("dblclick", () => startEditing(li, text, todo));
    // Delete button
    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Delete task");
    del.addEventListener("click", () => deleteTodo(todo.id));
    li.append(check, text, del);
    return li;
}
function startEditing(li, textEl, todo) {
    const editInput = document.createElement("input");
    editInput.className = "edit-input";
    editInput.value = todo.text;
    li.replaceChild(editInput, textEl);
    editInput.focus();
    editInput.select();
    let finished = false;
    const finish = (save) => {
        if (finished)
            return;
        finished = true;
        if (save)
            editTodo(todo.id, editInput.value);
        else
            render(); // cancel: just redraw
    };
    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter")
            finish(true);
        if (e.key === "Escape")
            finish(false);
    });
    editInput.addEventListener("blur", () => finish(true));
}
function render() {
    // 1. List
    list.innerHTML = "";
    const items = visibleTodos();
    items.forEach((todo) => list.appendChild(createItem(todo)));
    newestId = null; // animate once, not on every redraw
    // 2. Empty state
    emptyBox.classList.toggle("hidden", items.length > 0);
    const messages = {
        all: "Nothing here yet. Add your first task!",
        active: "All caught up — nothing left to do 🎉",
        completed: "No finished tasks yet.",
    };
    emptyText.textContent = messages[currentFilter];
    // 3. Counter
    const left = todos.filter((t) => !t.done).length;
    countEl.textContent = `${left} task${left === 1 ? "" : "s"} left`;
    // 4. Progress bar
    const doneCount = todos.length - left;
    const percent = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;
    progressBar.style.width = percent + "%";
    progressText.textContent = `${doneCount}/${todos.length} done · ${percent}%`;
    // 5. Active filter button
    filterButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.filter === currentFilter));
}
// ================== Events ==================
form.addEventListener("submit", (e) => {
    e.preventDefault(); // stop the page from reloading
    addTodo(input.value);
    input.value = "";
    input.focus();
});
filterButtons.forEach((btn) => btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    render();
}));
clearDoneBtn.addEventListener("click", () => {
    todos = todos.filter((t) => !t.done);
    update();
});
// "Clear all" asks for a second click instead of a popup
let confirmTimer;
clearAllBtn.addEventListener("click", () => {
    if (!todos.length)
        return;
    if (clearAllBtn.dataset.confirm === "yes") {
        window.clearTimeout(confirmTimer);
        resetClearAll();
        todos = [];
        update();
    }
    else {
        clearAllBtn.dataset.confirm = "yes";
        clearAllBtn.textContent = "Click again to confirm";
        confirmTimer = window.setTimeout(resetClearAll, 3000); // cancel after 3s
    }
});
function resetClearAll() {
    delete clearAllBtn.dataset.confirm;
    clearAllBtn.textContent = "Clear all";
}
// ================== Start ==================
dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
});
render();
