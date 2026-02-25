# app.py
print("=" * 50)
print("🚀 Starting Family Calendar App...")
print("=" * 50)

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import os
from config import Config
from models import db, Event

print("✅ Imports successful")

app = Flask(__name__)
app.config.from_object(Config)   # loads SECRET_KEY, SQLALCHEMY_DATABASE_URI, etc.

# Bind SQLAlchemy to this app and create tables if they don't exist
db.init_app(app)
with app.app_context():
    db.create_all()
    print("✅ Database ready")

print("✅ Flask app created")

# Authorised users  (username → password)
USERS = {
    'Vikrant':  'Vikrant',
    'Snehal':   'Snehal',
    'Arnav':    'Arnav',
    'Arshiya':  'Arshiya',
}

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page"""
    if 'username' in session:
        return redirect(url_for('index'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        if username in USERS and USERS[username] == password:
            session['username'] = username
            print(f"🔑 User logged in: {username}")
            return redirect(url_for('index'))
        return render_template('login.html', error='Invalid username or password')
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout and redirect to login"""
    username = session.pop('username', None)
    print(f"👋 User logged out: {username}")
    return redirect(url_for('login'))

@app.route('/api/me')
@login_required
def me():
    """Return the currently logged-in user"""
    return jsonify({'username': session['username']})

@app.route('/')
@login_required
def index():
    """Render the main page"""
    print("📄 Serving index page")
    return render_template('index.html', username=session['username'])

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    all_events = Event.query.order_by(Event.date, Event.time).all()
    print(f"📋 Getting events: {len(all_events)} events found")
    return jsonify([e.to_dict() for e in all_events])

@app.route('/api/events', methods=['POST'])
def add_event():
    """Add a new event"""
    try:
        data = request.get_json()
        print(f"➕ Adding event: {data.get('name', 'Unknown')}")

        # Validate required fields
        required_fields = ['name', 'date', 'time', 'duration', 'category', 'user']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        # Create and persist the Event row
        event = Event(
            name=data['name'],
            date=data['date'],
            time=data['time'],
            duration=int(data['duration']),
            category=data['category'],
            user=data['user'],
        )
        db.session.add(event)
        db.session.commit()
        print(f"✅ Event added successfully (id={event.id})")

        return jsonify({'message': 'Event added successfully', 'event': event.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Update an existing event"""
    try:
        event = db.session.get(Event, event_id)
        if event is None:
            return jsonify({'error': 'Event not found'}), 404

        data = request.get_json()
        event.name     = data.get('name',     event.name)
        event.date     = data.get('date',     event.date)
        event.time     = data.get('time',     event.time)
        event.duration = int(data.get('duration', event.duration))
        event.category = data.get('category', event.category)
        event.user     = data.get('user',     event.user)
        db.session.commit()
        print(f"✏️ Event {event_id} updated")
        return jsonify({'message': 'Event updated successfully', 'event': event.to_dict()})

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event"""
    event = db.session.get(Event, event_id)
    if event is None:
        return jsonify({'error': 'Event not found'}), 404
    db.session.delete(event)
    db.session.commit()
    print(f"🗑️ Event {event_id} deleted")
    return jsonify({'message': 'Event deleted successfully'})

@app.route('/health')
def health():
    """Health check endpoint for Railway"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🌐 Starting Flask server...")
    print("=" * 50)
    
    # Get port from environment variable
    port = int(os.environ.get('PORT', 5000))
    # Use debug=False for production
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
    
    print(f"📍 Server will run on: http://localhost:{port}")
    print(f"📍 Or try: http://127.0.0.1:{port}")
    print("=" * 50)
    print("Press CTRL+C to quit")
    print("=" * 50 + "\n")
    
    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check if port 5000 is already in use")
        print("2. Try running: netstat -ano | findstr :5000")
        print("3. Or try a different port: set PORT=8000 && python app.py")