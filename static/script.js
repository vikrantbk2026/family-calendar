// static/script.js

// Load events when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadEvents();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    
    // Set current time as default
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    document.getElementById('eventTime').value = time;
});

// Handle form submission
document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const eventData = {
        name: document.getElementById('eventName').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        duration: document.getElementById('eventDuration').value
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
            
            // Reload events
            loadEvents();
            
            // Show success message
            alert('✅ Event added successfully!');
        } else {
            const error = await response.json();
            alert('❌ Error: ' + error.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Failed to add event');
    }
});

// Load and display events
async function loadEvents() {
    try {
        const response = await fetch('/api/events');
        const events = await response.json();
        
        displayCalendar(events);
        displayEventsList(events);
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
    
    calendar.innerHTML = events.map(event => `
        <div class="event-card">
            <button class="delete-btn" onclick="deleteEvent(${event.id})">×</button>
            <h3>${event.name}</h3>
            <div class="event-details">
                📅 ${formatDate(event.date)}
            </div>
            <div class="event-details">
                🕐 ${event.time} (${event.duration} min)
            </div>
        </div>
    `).join('');
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
    
    eventsList.innerHTML = sortedEvents.map(event => `
        <div class="event-item">
            <div class="event-info">
                <h4>${event.name}</h4>
                <p>${formatDate(event.date)} at ${event.time} • ${event.duration} minutes</p>
            </div>
            <button class="delete-btn" onclick="deleteEvent(${event.id})" style="position: static;">×</button>
        </div>
    `).join('');
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
            alert('✅ Event deleted successfully!');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Failed to delete event');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}