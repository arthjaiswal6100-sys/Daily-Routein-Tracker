/* =====================================================
   MY PROGRESS — ARTH
   DAILY TRACKER
   ===================================================== */


/* ================= DATA ================= */

let allData = JSON.parse(
    localStorage.getItem("myProgressData")
) || {};

let selectedDate = getDateKey();

let editingTaskId = null;

let todayChart = null;
let weekChart = null;
let monthChart = null;


/* ================= DATE ================= */

function getDateKey(date = new Date()) {

    const y = date.getFullYear();

    const m = String(date.getMonth() + 1).padStart(2, "0");

    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function parseDate(key) {

    const [y, m, d] = key.split("-").map(Number);

    return new Date(y, m - 1, d);
}


function formatDate(key) {

    return parseDate(key).toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


function dayNumberFor(key) {

    const dates = Object.keys(allData)
        .filter(key => {
            const day = allData[key];

            return day &&
                Array.isArray(day.tasks) &&
                day.tasks.length > 0;
        })
        .sort();

    const index = dates.indexOf(key);

    if (index !== -1) {
        return index + 1;
    }

    return dates.length + 1;
}


/* ================= DAY DATA ================= */

function getDayData(key = selectedDate) {

    if (!allData[key]) {

        allData[key] = {
            tasks: [],
            notes: ""
        };

    }

    if (!Array.isArray(allData[key].tasks)) {
        allData[key].tasks = [];
    }

    if (typeof allData[key].notes !== "string") {
        allData[key].notes = "";
    }

    return allData[key];
}


/* ================= SAVE ================= */

function saveData() {

    localStorage.setItem(
        "myProgressData",
        JSON.stringify(allData)
    );

}


/* ================= START ================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTheme();

        updateDate();

        setGreeting();

        loadSelectedDay();

        updateAll();

        createCharts();

        setupKeyboard();

    }
);


/* ================= HEADER ================= */

function updateDate() {

    document.getElementById("dateText").textContent =
        formatDate(getDateKey());

}


function setGreeting() {

    const hour = new Date().getHours();

    let greeting = "Good Evening 👋";

    if (hour < 12) {

        greeting = "Good Morning ☀️";

    }
    else if (hour < 18) {

        greeting = "Good Afternoon 🌤️";

    }

    document.getElementById(
        "greeting"
    ).textContent = greeting;

}


/* ================= NAVIGATION ================= */

function showSection(sectionId, button) {

    document.querySelectorAll(
        ".section"
    ).forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });


    document
        .getElementById(sectionId)
        .classList.add("active-section");


    document.querySelectorAll(
        ".nav-btn"
    ).forEach(btn => {

        btn.classList.remove("active");

    });


    button.classList.add("active");


    if (sectionId === "week") {

        updateWeek();

        createWeekChart();

    }


    if (sectionId === "month") {

        updateMonth();

        createMonthChart();

    }


    if (sectionId === "history") {

        renderHistory();

    }


    if (sectionId === "overall") {

        updateOverall();

    }

}


/* ================= DAY SWITCH ================= */

function changeDay(amount) {

    const date = parseDate(selectedDate);

    date.setDate(
        date.getDate() + amount
    );

    const newKey = getDateKey(date);

    if (
        newKey > getDateKey()
    ) {
        return;
    }

    selectedDate = newKey;

    loadSelectedDay();

}


function goToToday() {

    selectedDate = getDateKey();

    loadSelectedDay();

}


function loadSelectedDay() {

    const data = getDayData(selectedDate);

    const number = dayNumberFor(selectedDate);

    document.getElementById(
        "dayNumber"
    ).textContent =
        `DAY ${number}`;


    document.getElementById(
        "selectedDate"
    ).textContent =
        formatDate(selectedDate);


    const isToday =
        selectedDate === getDateKey();


    document.getElementById(
        "goalHeading"
    ).textContent =
        isToday
            ? "Today's Goals"
            : `Goals — ${formatDate(selectedDate)}`;


    document.getElementById(
        "dayNotes"
    ).value = data.notes || "";


    renderTasks();

    updateDashboard();

    createTodayChart();

}


/* ================= MODAL ================= */

function openTaskModal(taskId = null) {

    editingTaskId = taskId;

    const modal =
        document.getElementById("taskModal");

    const input =
        document.getElementById("taskInput");

    const category =
        document.getElementById("categoryInput");

    const important =
        document.getElementById("importantInput");

    if (taskId !== null) {

        const task =
            getDayData().tasks.find(
                t => t.id === taskId
            );

        if (!task) return;

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Edit Goal ✏️";

        input.value = task.name;

        category.value = task.category;

        important.checked =
            Boolean(task.important);

    }
    else {

        document.getElementById(
            "modalTitle"
        ).textContent =
            "Add New Goal 🎯";

        input.value = "";

        category.value = "📚 Study";

        important.checked = false;

    }

    modal.classList.add("show");

    setTimeout(() => {
        input.focus();
    }, 100);

}


function closeTaskModal() {

    document
        .getElementById("taskModal")
        .classList.remove("show");

    editingTaskId = null;

}


/* ================= SAVE TASK ================= */

function saveTask() {

    const input =
        document.getElementById("taskInput");

    const category =
        document.getElementById("categoryInput");

    const important =
        document.getElementById("importantInput");

    const name =
        input.value.trim();


    if (!name) {

        alert("Please enter a goal.");

        return;

    }


    const data = getDayData();


    if (editingTaskId !== null) {

        const task =
            data.tasks.find(
                t => t.id === editingTaskId
            );

        if (task) {

            task.name = name;

            task.category = category.value;

            task.important =
                important.checked;

        }

    }
    else {

        data.tasks.push({

            id: Date.now(),

            name: name,

            category: category.value,

            important: important.checked,

            completed: false

        });

    }


    saveData();

    closeTaskModal();

    renderTasks();

    updateDashboard();

    createTodayChart();

    updateWeek();

    updateMonth();

    updateOverall();

}


/* ================= RENDER TASKS ================= */

function renderTasks() {

    const data = getDayData();

    const list =
        document.getElementById("taskList");

    const empty =
        document.getElementById("emptyState");


    list.innerHTML = "";


    if (data.tasks.length === 0) {

        empty.style.display = "block";

        return;

    }


    empty.style.display = "none";


    data.tasks.forEach(
        (task, index) => {

            const item =
                document.createElement("div");

            item.className = "task-item";

            if (task.completed) {
                item.classList.add("completed");
            }


            item.innerHTML = `

                <div
                    class="drag-handle"
                    title="Move goal"
                >
                    ⋮⋮
                </div>

                <div
                    class="checkbox ${
                        task.completed
                            ? "checked"
                            : ""
                    }"
                    onclick="toggleTask(${task.id})"
                >
                    ${
                        task.completed
                            ? "✓"
                            : ""
                    }
                </div>

                <div class="task-info">

                    <div class="task-name">

                        ${
                            task.important
                                ? `<span class="important-badge">⭐</span>`
                                : ""
                        }

                        ${escapeHTML(task.name)}

                    </div>

                    <div class="task-category">
                        ${escapeHTML(task.category)}
                    </div>

                </div>

                <div class="task-actions">

                    <button
                        class="task-action"
                        onclick="moveTask(${task.id}, -1)"
                        title="Move up"
                    >
                        ↑
                    </button>

                    <button
                        class="task-action"
                        onclick="moveTask(${task.id}, 1)"
                        title="Move down"
                    >
                        ↓
                    </button>

                    <button
                        class="task-action"
                        onclick="openTaskModal(${task.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        class="task-action"
                        onclick="deleteTask(${task.id})"
                        title="Delete"
                    >
                        ×
                    </button>

                </div>
            `;


            list.appendChild(item);

        }
    );

}


/* ================= TOGGLE ================= */

function toggleTask(id) {

    const data = getDayData();

    const task =
        data.tasks.find(
            t => t.id === id
        );

    if (!task) return;


    task.completed =
        !task.completed;


    saveData();

    renderTasks();

    updateDashboard();

    createTodayChart();

    updateWeek();

    updateMonth();

    updateOverall();

}


/* ================= MOVE ================= */

function moveTask(id, direction) {

    const data = getDayData();

    const index =
        data.tasks.findIndex(
            t => t.id === id
        );

    if (index === -1) return;


    const newIndex =
        index + direction;


    if (
        newIndex < 0 ||
        newIndex >= data.tasks.length
    ) {
        return;
    }


    [
        data.tasks[index],
        data.tasks[newIndex]
    ] = [
        data.tasks[newIndex],
        data.tasks[index]
    ];


    saveData();

    renderTasks();

}


/* ================= DELETE ================= */

function deleteTask(id) {

    const data = getDayData();

    const task =
        data.tasks.find(
            t => t.id === id
        );

    if (!task) return;


    const okay =
        confirm(
            `Delete "${task.name}"?`
        );

    if (!okay) return;


    data.tasks =
        data.tasks.filter(
            t => t.id !== id
        );


    saveData();

    renderTasks();

    updateDashboard();

    createTodayChart();

    updateWeek();

    updateMonth();

    updateOverall();

}


/* ================= DASHBOARD ================= */

function updateDashboard() {

    const data = getDayData();

    const total =
        data.tasks.length;

    const completed =
        data.tasks.filter(
            t => t.completed
        ).length;

    const remaining =
        total - completed;

    const percent =
        total === 0
            ? 0
            : Math.round(
                completed /
                total *
                100
            );


    document.getElementById(
        "todayPercent"
    ).textContent =
        `${percent}%`;


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;


    document.getElementById(
        "remainingCount"
    ).textContent =
        remaining;


    document.getElementById(
        "todayBar"
    ).style.width =
        `${percent}%`;


    const circumference = 490;

    const offset =
        circumference -
        percent / 100 *
        circumference;


    document.getElementById(
        "progressCircle"
    ).style.strokeDashoffset =
        offset;


    updateMotivation(percent);


    document.getElementById(
        "streakCount"
    ).textContent =
        `${calculateStreak()} days`;


    updateComparison();

}


/* ================= MOTIVATION ================= */

function updateMotivation(percent) {

    let message =
        "Your journey starts with one small step.";


    if (percent === 0) {

        message =
            "Your journey starts with one small step.";

    }
    else if (percent < 30) {

        message =
            "You've started. Keep the momentum going.";

    }
    else if (percent < 60) {

        message =
            "Nice work! You're building momentum.";

    }
    else if (percent < 100) {

        message =
            "You're doing great! Push a little further.";

    }
    else {

        message =
            "🔥 Amazing! You completed everything today!";

    }


    document.getElementById(
        "motivationText"
    ).textContent = message;

}


/* ================= NOTES ================= */

function saveNotes() {

    const data = getDayData();

    data.notes =
        document.getElementById(
            "dayNotes"
        ).value;


    saveData();


    const status =
        document.getElementById(
            "saveStatus"
        );

    status.textContent =
        "✓ Saved";


    clearTimeout(
        window.noteTimer
    );


    window.noteTimer =
        setTimeout(() => {

            status.textContent =
                "Auto-saved";

        }, 1000);

}


/* ================= STREAK ================= */

function calculateStreak() {

    let streak = 0;

    let date = new Date();


    while (true) {

        const key =
            getDateKey(date);

        const day =
            allData[key];


        if (
            day &&
            day.tasks &&
            day.tasks.length > 0 &&
            day.tasks.every(
                task => task.completed
            )
        ) {

            streak++;

            date.setDate(
                date.getDate() - 1
            );

        }
        else {

            break;

        }

    }


    return streak;

}


/* ================= BEST STREAK ================= */

function calculateBestStreak() {

    const dates =
        Object.keys(allData)
            .filter(key => {

                const day =
                    allData[key];

                return day &&
                    day.tasks &&
                    day.tasks.length > 0;

            })
            .sort();


    let best = 0;

    let current = 0;

    let previous = null;


    dates.forEach(key => {

        const day =
            allData[key];


        const complete =
            day.tasks.length > 0 &&
            day.tasks.every(
                task => task.completed
            );


        if (!complete) {

            current = 0;

            previous = null;

            return;

        }


        if (previous) {

            const diff =
                (
                    parseDate(key) -
                    parseDate(previous)
                ) /
                (1000 * 60 * 60 * 24);


            if (diff === 1) {

                current++;

            }
            else {

                current = 1;

            }

        }
        else {

            current = 1;

        }


        best =
            Math.max(
                best,
                current
            );


        previous = key;

    });


    return best;

}


/* ================= COMPARISON ================= */

function updateComparison() {

    const date =
        parseDate(selectedDate);

    date.setDate(
        date.getDate() - 1
    );


    const yesterdayKey =
        getDateKey(date);


    const today =
        getDayData(
            selectedDate
        );


    const yesterday =
        allData[yesterdayKey];


    const currentPercent =
        getPercent(today);


    const previousPercent =
        yesterday
            ? getPercent(yesterday)
            : 0;


    const difference =
        currentPercent -
        previousPercent;


    const element =
        document.getElementById(
            "comparison"
        );


    if (difference > 0) {

        element.textContent =
            `+${difference}%`;

    }
    else if (difference < 0) {

        element.textContent =
            `${difference}%`;

    }
    else {

        element.textContent =
            "0%";

    }

}


/* ================= PERCENT ================= */

function getPercent(day) {

    if (
        !day ||
        !day.tasks ||
        day.tasks.length === 0
    ) {
        return 0;
    }


    const completed =
        day.tasks.filter(
            t => t.completed
        ).length;


    return Math.round(
        completed /
        day.tasks.length *
        100
    );

}


/* ================= WEEK ================= */

function updateWeek() {

    const now =
        new Date();

    let total = 0;

    let completed = 0;


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date(now);

        date.setDate(
            now.getDate() - i
        );


        const key =
            getDateKey(date);


        const day =
            allData[key];


        if (day) {

            total +=
                day.tasks.length;

            completed +=
                day.tasks.filter(
                    t => t.completed
                ).length;

        }

    }


    const percent =
        total === 0
            ? 0
            : Math.round(
                completed /
                total *
                100
            );


    document.getElementById(
        "weekPercent"
    ).textContent =
        `${percent}%`;


    document.getElementById(
        "weekBar"
    ).style.width =
        `${percent}%`;

}


/* ================= MONTH ================= */

function updateMonth() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        now.getMonth();


    let total = 0;

    let completed = 0;


    Object.keys(allData)
        .forEach(key => {

            const date =
                parseDate(key);


            if (
                date.getFullYear() === year &&
                date.getMonth() === month
            ) {

                const day =
                    allData[key];


                if (day.tasks) {

                    total +=
                        day.tasks.length;

                    completed +=
                        day.tasks.filter(
                            t => t.completed
                        ).length;

                }

            }

        });


    const percent =
        total === 0
            ? 0
            : Math.round(
                completed /
                total *
                100
            );


    document.getElementById(
        "monthPercent"
    ).textContent =
        `${percent}%`;


    document.getElementById(
        "monthBar"
    ).style.width =
        `${percent}%`;

}


/* ================= OVERALL ================= */

function updateOverall() {

    let total = 0;

    let completed = 0;

    let activeDays = 0;


    Object.values(allData)
        .forEach(day => {

            if (
                !day ||
                !Array.isArray(day.tasks)
            ) {
                return;
            }


            total +=
                day.tasks.length;


            completed +=
                day.tasks.filter(
                    t => t.completed
                ).length;


            if (
                day.tasks.length > 0
            ) {

                activeDays++;

            }

        });


    const percent =
        total === 0
            ? 0
            : Math.round(
                completed /
                total *
                100
            );


    document.getElementById(
        "overallPercent"
    ).textContent =
        `${percent}%`;


    document.getElementById(
        "totalGoals"
    ).textContent =
        total;


    document.getElementById(
        "totalCompleted"
    ).textContent =
        completed;


    document.getElementById(
        "activeDays"
    ).textContent =
        activeDays;


    document.getElementById(
        "bestStreak"
    ).textContent =
        calculateBestStreak();

}


/* ================= HISTORY ================= */

function renderHistory() {

    const container =
        document.getElementById(
            "historyList"
        );


    container.innerHTML = "";


    const dates =
        Object.keys(allData)
            .filter(key => {

                const day =
                    allData[key];

                return day &&
                    Array.isArray(day.tasks) &&
                    (
                        day.tasks.length > 0 ||
                        day.notes
                    );

            })
            .sort()
            .reverse();


    if (dates.length === 0) {

        container.innerHTML = `

            <div class="no-history">

                🕘

                <h3>No history yet</h3>

                <p>
                    Add goals and your daily records
                    will appear here.
                </p>

            </div>
        `;

        return;

    }


    dates.forEach(key => {

        const day =
            allData[key];


        const percent =
            getPercent(day);


        const number =
            dayNumberFor(key);


        const item =
            document.createElement("div");


        item.className =
            "history-item";


        item.innerHTML = `

            <div class="history-main">

                <div>

                    <div class="history-day">
                        DAY ${number}
                    </div>

                    <div class="history-date">
                        ${formatDate(key)}
                    </div>

                    <div class="history-count">

                        ${
                            day.tasks.length
                        }
                        goals •
                        ${
                            day.tasks.filter(
                                t => t.completed
                            ).length
                        }
                        completed

                    </div>

                </div>

                <div class="history-percent">
                    ${percent}%
                </div>

            </div>

            <div class="history-bar">

                <div
                    style="width:${percent}%"
                ></div>

            </div>

            ${
                day.notes
                    ? `
                    <div class="history-note">
                        📝 ${escapeHTML(day.notes)}
                    </div>
                    `
                    : ""
            }

            <button
                class="history-open"
                onclick="openHistoryDay('${key}')"
            >
                View This Day →
            </button>

        `;


        container.appendChild(item);

    });

}


/* ================= OPEN HISTORY DAY ================= */

function openHistoryDay(key) {

    selectedDate = key;

    showTodayFromHistory();

}


function showTodayFromHistory() {

    document.querySelectorAll(
        ".section"
    ).forEach(section => {

        section.classList.remove(
            "active-section"
        );

    });


    document
        .getElementById("today")
        .classList.add("active-section");


    document.querySelectorAll(
        ".nav-btn"
    ).forEach(btn => {

        btn.classList.remove("active");

    });


    document
        .querySelector(
            ".nav-btn"
        )
        .classList.add("active");


    loadSelectedDay();

}


/* ================= CHARTS ================= */

function createCharts() {

    createTodayChart();

    createWeekChart();

    createMonthChart();

}


/* ================= TODAY CHART ================= */

function createTodayChart() {

    const canvas =
        document.getElementById(
            "todayChart"
        );


    if (!canvas) return;


    if (todayChart) {

        todayChart.destroy();

    }


    const day =
        getDayData();


    const total =
        day.tasks.length;


    const completed =
        day.tasks.filter(
            t => t.completed
        ).length;


    const percent =
        getPercent(day);


    const points = [
        0,
        total ? Math.round(percent * .25) : 0,
        total ? Math.round(percent * .5) : 0,
        total ? Math.round(percent * .75) : 0,
        percent
    ];


    todayChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels: [
                        "Start",
                        "25%",
                        "50%",
                        "75%",
                        "Now"
                    ],

                    datasets: [
                        {
                            label: "Progress",
                            data: points,
                            tension: .4,
                            fill: true
                        }
                    ]

                },

                options: {

                    responsive: true,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {
                                callback:
                                    value =>
                                        value + "%"
                            }

                        }

                    }

                }

            }
        );

}


/* ================= WEEK CHART ================= */

function createWeekChart() {

    const canvas =
        document.getElementById(
            "weekChart"
        );


    if (!canvas) return;


    if (weekChart) {

        weekChart.destroy();

    }


    const labels = [];

    const values = [];

    const now =
        new Date();


    for (
        let i = 6;
        i >= 0;
        i--
    ) {

        const date =
            new Date(now);


        date.setDate(
            now.getDate() - i
        );


        const key =
            getDateKey(date);


        labels.push(
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            )
        );


        values.push(
            allData[key]
                ? getPercent(
                    allData[key]
                )
                : 0
        );

    }


    weekChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [
                        {
                            label:
                                "Daily Progress",

                            data: values,

                            tension: .4,

                            fill: true
                        }
                    ]

                },

                options: {

                    responsive: true,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {
                                callback:
                                    value =>
                                        value + "%"
                            }

                        }

                    }

                }

            }
        );

}


/* ================= MONTH CHART ================= */

function createMonthChart() {

    const canvas =
        document.getElementById(
            "monthChart"
        );


    if (!canvas) return;


    if (monthChart) {

        monthChart.destroy();

    }


    const now =
        new Date();


    const days =
        new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate();


    const labels = [];

    const values = [];


    for (
        let i = 1;
        i <= days;
        i++
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                i
            );


        const key =
            getDateKey(date);


        labels.push(i);


        values.push(
            allData[key]
                ? getPercent(
                    allData[key]
                )
                : 0
        );

    }


    monthChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [
                        {
                            label:
                                "Monthly Progress",

                            data: values,

                            tension: .35,

                            fill: true
                        }
                    ]

                },

                options: {

                    responsive: true,

                    plugins: {
                        legend: {
                            display: false
                        }
                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {
                                callback:
                                    value =>
                                        value + "%"
                            }

                        }

                    }

                }

            }
        );

}


/* ================= THEME ================= */

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "myProgressTheme",
        dark ? "dark" : "light"
    );


    updateThemeButton();

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "myProgressTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark"
        );

    }


    updateThemeButton();

}


function updateThemeButton() {

    const button =
        document.getElementById(
            "themeToggle"
        );


    if (!button) return;


    button.textContent =
        document.body.classList.contains(
            "dark"
        )
            ? "☀️"
            : "🌙";

}


/* ================= BACKUP ================= */

function exportData() {

    const backup = {

        app: "MyProgress",

        user: "ARTH",

        exportedAt:
            new Date().toISOString(),

        data: allData

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    backup,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `myprogress-backup-${getDateKey()}.json`;


    link.click();


    URL.revokeObjectURL(url);

}


function restoreData(event) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            try {

                const backup =
                    JSON.parse(
                        e.target.result
                    );


                const imported =
                    backup.data ||
                    backup;


                if (
                    typeof imported !==
                    "object"
                ) {
                    throw new Error();
                }


                const okay =
                    confirm(
                        "Restore this backup? Current data will be replaced."
                    );


                if (!okay) return;


                allData =
                    imported;


                saveData();

                selectedDate =
                    getDateKey();


                loadSelectedDay();

                updateOverall();

                renderHistory();

                createCharts();

                alert(
                    "Backup restored successfully."
                );

            }
            catch {

                alert(
                    "This backup file is not valid."
                );

            }

        };


    reader.readAsText(file);

    event.target.value = "";

}


/* ================= AI ================= */

function connectAI() {

    document
        .getElementById("aiModal")
        .classList.add("show");

}


function closeAIModal() {

    document
        .getElementById("aiModal")
        .classList.remove("show");

}


/* ================= KEYBOARD ================= */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeTaskModal();

                closeAIModal();

            }


            if (
                event.key === "Enter" &&
                document
                    .getElementById(
                        "taskModal"
                    )
                    .classList.contains(
                        "show"
                    )
            ) {

                saveTask();

            }

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                event.target.classList.contains(
                    "modal"
                )
            ) {

                event.target.classList.remove(
                    "show"
                );

            }

        }
    );

}


/* ================= SECURITY ================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;

}


/* ================= GLOBAL UPDATE ================= */

function updateAll() {

    updateDashboard();

    updateWeek();

    updateMonth();

    updateOverall();

}


/* =====================================================
   END
   ===================================================== */