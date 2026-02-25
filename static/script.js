// static/script.js

// Load events when page loads
document.addEventListener('DOMContentLoaded', async function() {
    loadEvents();

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;

    // Set current time as default
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    document.getElementById('eventTime').value = time;

    // Pre-fill User dropdown with logged-in user and store for filtering
    try {
        const res = await fetch('/api/me');
        const data = await res.json();
        currentUser = data.username;
        document.getElementById('eventUser').value = data.username;
    } catch (e) {
        console.error('Could not fetch current user', e);
    }
});

// Handle form submission
document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const eventData = {
        name: document.getElementById('eventName').value,
        user: document.getElementById('eventUser').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        duration: document.getElementById('eventDuration').value,
        category: document.getElementById('eventCategory').value
    };
    
    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            // Clear form
            document.getElementById('eventForm').reset();

            // Reset defaults
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('eventDate').value = today;
            const now = new Date();
            const time = now.toTimeString().slice(0, 5);
            document.getElementById('eventTime').value = time;
            document.getElementById('eventDuration').value = 60;

            // Re-fill logged-in user
            try {
                const res = await fetch('/api/me');
                const data = await res.json();
                document.getElementById('eventUser').value = data.username;
            } catch (_) {}

            loadEvents();
            showToast('Event added successfully');
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to add event', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add event', 'error');
    }
});

// In-memory cache of events for modal lookup
let eventsCache = [];

// Filter state
let currentUser = null;
let filterMine  = false;

// Load and display events
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        eventsCache = events;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = events.filter(e => new Date(e.date + 'T00:00:00') >= today);
        const past     = events.filter(e => new Date(e.date + 'T00:00:00') <  today);

        const visibleUpcoming = filterMine && currentUser ? upcoming.filter(e => e.user === currentUser) : upcoming;
        const visiblePast     = filterMine && currentUser ? past.filter(e => e.user === currentUser)     : past;

        displayCalendar(visibleUpcoming);
        displayEventsList(visibleUpcoming);
        displayHistoryList(visiblePast);
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Display events in calendar grid
function displayCalendar(events) {
    const calendar = document.getElementById('calendar');
    const noEvents = document.getElementById('noEvents');
    
    if (events.length === 0) {
        calendar.style.display = 'none';
        noEvents.style.display = 'block';
        return;
    }
    
    calendar.style.display = 'grid';
    noEvents.style.display = 'none';
    
    calendar.innerHTML = events.map(event => {
        const timing = getEventTiming(event.date);
        const timingBadge = timing === 'today'
            ? '<span class="timing-badge timing-today">Today</span>'
            : timing === 'tomorrow'
            ? '<span class="timing-badge timing-tomorrow">Tomorrow</span>'
            : '';
        const weekendBadge = isWeekend(event.date) ? '<span class="timing-badge timing-weekend">Weekend</span>' : '';
        const highlightClass = timing
            ? ` timing-highlight-${timing}`
            : isWeekend(event.date) ? ' timing-highlight-weekend' : '';
        return `
        <div class="event-card category-${getCategoryKey(event.category)}${highlightClass}" onclick="handleCardClick(${event.id})">
            <button class="delete-btn" onclick="event.stopPropagation(); deleteEvent(${event.id})">×</button>
            ${timingBadge}${weekendBadge}
            <span class="category-badge">${event.category || 'Other'}</span>
            <h3>${event.name}</h3>
            <div class="event-details">
                📅 ${formatDate(event.date)}
            </div>
            <div class="event-details">
                🕐 ${event.time} (${event.duration} min)
            </div>
            <div class="event-details">
                👤 ${event.user || '—'}
            </div>
        </div>`;
    }).join('');
}

// Display events in list view
function displayEventsList(events) {
    const eventsList = document.getElementById('eventsList');
    
    if (events.length === 0) {
        eventsList.innerHTML = '<p class="no-events">No upcoming events</p>';
        return;
    }
    
    // Sort events by date and time
    const sortedEvents = events.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
    });
    
    eventsList.innerHTML = sortedEvents.map(event => {
        const timing = getEventTiming(event.date);
        const timingBadge = timing === 'today'
            ? '<span class="timing-badge timing-today">Today</span>'
            : timing === 'tomorrow'
            ? '<span class="timing-badge timing-tomorrow">Tomorrow</span>'
            : '';
        const weekendBadge = isWeekend(event.date) ? '<span class="timing-badge timing-weekend">Weekend</span>' : '';
        const highlightClass = timing
            ? ` timing-highlight-${timing}`
            : isWeekend(event.date) ? ' timing-highlight-weekend' : '';
        return `
        <div class="event-item category-${getCategoryKey(event.category)}${highlightClass}">
            <div class="event-info">
                <h4>${event.name} <span class="category-badge badge-${getCategoryKey(event.category)}">${event.category || 'Other'}</span> ${timingBadge}${weekendBadge} <span class="user-badge-list">👤 ${event.user || '—'}</span></h4>
                <p>${formatDate(event.date)} at ${event.time} • ${event.duration} minutes</p>
            </div>
            <button class="delete-btn" onclick="deleteEvent(${event.id})" style="position: static;">×</button>
        </div>`;
    }).join('');
}

// Display past events in history section
function displayHistoryList(pastEvents) {
    const historyList = document.getElementById('historyList');
    document.getElementById('historyCount').textContent = pastEvents.length;

    if (pastEvents.length === 0) {
        historyList.innerHTML = '<p class="no-events">No past events yet.</p>';
        return;
    }

    // Most recent first
    const sorted = pastEvents.sort((a, b) =>
        new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)
    );

    historyList.innerHTML = sorted.map(event => {
        const weekendBadge = isWeekend(event.date) ? '<span class="timing-badge timing-weekend">Weekend</span>' : '';
        return `
        <div class="event-item history-item category-${getCategoryKey(event.category)}">
            <div class="event-info">
                <h4>${event.name} <span class="category-badge badge-${getCategoryKey(event.category)}">${event.category || 'Other'}</span> ${weekendBadge} <span class="user-badge-list">👤 ${event.user || '—'}</span></h4>
                <p>${formatDate(event.date)} at ${event.time} • ${event.duration} minutes</p>
            </div>
            <button class="delete-btn" onclick="deleteEvent(${event.id})" style="position: static;">×</button>
        </div>
        `;
    }).join('');
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEvents();
            showToast('Event deleted');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to delete event', 'error');
    }
}

// Called when an event card is clicked
function handleCardClick(eventId) {
    const event = eventsCache.find(ev => ev.id === eventId);
    if (event) openEditModal(event);
}

// Open edit modal pre-filled with event data
function openEditModal(event) {
    document.getElementById('editEventId').value = event.id;
    document.getElementById('editName').value = event.name;
    document.getElementById('editUser').value = event.user || '';
    document.getElementById('editCategory').value = event.category || 'Other';
    document.getElementById('editDate').value = event.date;
    document.getElementById('editTime').value = event.time;
    document.getElementById('editDuration').value = event.duration;
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// Handle edit form submission
document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('editEventId').value;
    const updatedData = {
        name: document.getElementById('editName').value,
        user: document.getElementById('editUser').value,
        category: document.getElementById('editCategory').value,
        date: document.getElementById('editDate').value,
        time: document.getElementById('editTime').value,
        duration: document.getElementById('editDuration').value
    };
    try {
        const response = await fetch(`/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (response.ok) {
            closeModal();
            loadEvents();
            showToast('Event updated');
        } else {
            const error = await response.json();
            showToast(error.error || 'Failed to update event', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update event', 'error');
    }
});

// Toggle between All and Mine filter
function toggleFilter(mode) {
    filterMine = (mode === 'mine');
    document.getElementById('filterAllBtn').classList.toggle('active', !filterMine);
    document.getElementById('filterMineBtn').classList.toggle('active', filterMine);
    loadEvents();
}

// Switch between List and Card view tabs
function switchTab(tab) {
    document.getElementById('tab-list').style.display  = tab === 'list'  ? 'block' : 'none';
    document.getElementById('tab-cards').style.display = tab === 'cards' ? 'block' : 'none';
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (tab === 'list' && i === 0) || (tab === 'cards' && i === 1));
    });
}

// Toast notification (replaces alert)
let toastTimer;
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// Get CSS class key from category name
function getCategoryKey(category) {
    return category ? category.toLowerCase() : 'other';
}

// Returns true if the date falls on Saturday (6) or Sunday (0)
function isWeekend(dateString) {
    const day = new Date(dateString + 'T00:00:00').getDay();
    return day === 0 || day === 6;
}

// Returns 'today', 'tomorrow', or null
function getEventTiming(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const eventDate = new Date(dateString + 'T00:00:00');
    if (eventDate.getTime() === today.getTime()) return 'today';
    if (eventDate.getTime() === tomorrow.getTime()) return 'tomorrow';
    return null;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}