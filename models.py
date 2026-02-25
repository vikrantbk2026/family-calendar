# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# db is created here and shared across the app via init_app()
db = SQLAlchemy()

class Event(db.Model):
    """
    Maps to the 'events' table in SQLite.
    Each column corresponds to a field the frontend already sends/receives.
    """
    __tablename__ = 'events'

    # Auto-incrementing primary key — replaces the manual len(events)+1 trick
    id          = db.Column(db.Integer,     primary_key=True)

    name        = db.Column(db.String(200), nullable=False)
    user        = db.Column(db.String(100), nullable=False)

    # Stored as strings (YYYY-MM-DD / HH:MM) to match what the frontend sends
    date        = db.Column(db.String(10),  nullable=False)
    time        = db.Column(db.String(5),   nullable=False)

    duration    = db.Column(db.Integer,     nullable=False)
    category    = db.Column(db.String(50),  nullable=False)

    # Set automatically when a row is inserted
    created_at  = db.Column(db.String(50),  default=lambda: datetime.now().isoformat())

    def to_dict(self):
        """Return a plain dict so Flask can serialise it to JSON."""
        return {
            'id':         self.id,
            'name':       self.name,
            'user':       self.user,
            'date':       self.date,
            'time':       self.time,
            'duration':   self.duration,
            'category':   self.category,
            'created_at': self.created_at,
        }

    def __repr__(self):
        return f'<Event {self.id}: {self.name} on {self.date}>'
