# app.py
print("=" * 50)
print("🚀 Starting Family Calendar App...")
print("=" * 50)

from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os

print("✅ Imports successful")

app = Flask(__name__)
print("✅ Flask app created")

# In-memory storage for events
events = []

@app.route('/')
def index():
    """Render the main page"""
    print("📄 Serving index page")
   # return render_template('test_simple.html')
    return render_template('index.html')

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    print(f"📋 Getting events: {len(events)} events found")
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def add_event():
    """Add a new event"""
    try:
        data = request.get_json()
        print(f"➕ Adding event: {data.get('name', 'Unknown')}")
        
        # Validate required fields
        required_fields = ['name', 'date', 'time', 'duration']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Create event object
        event = {
            'id': len(events) + 1,
            'name': data['name'],
            'date': data['date'],
            'time': data['time'],
            'duration': int(data['duration']),
            'created_at': datetime.now().isoformat()
        }
        
        events.append(event)
        print(f"✅ Event added successfully. Total events: {len(events)}")
        
        return jsonify({
            'message': 'Event added successfully',
            'event': event
        }), 201
        
    except Exception as e:
        print(f"❌ Error adding event: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event"""
    global events
    events = [e for e in events if e['id'] != event_id]
    print(f"🗑️ Event {event_id} deleted. Remaining: {len(events)}")
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