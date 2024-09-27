from flask.cli import FlaskGroup
from app import app, db
from flask_migrate import Migrate, upgrade, init, migrate

# Initialize Flask-Migrate
migrate = Migrate(app, db)

cli = FlaskGroup(app)

def run_migrations():
    with app.app_context():
        # Check if migrations folder exists
        try:
            # Create a new migration
            migrate(message="Add personality column to Session model")
            # Apply the migration
            upgrade()
            print("Migration for adding 'personality' column to Session model completed.")
        except Exception as e:
            print(f"An error occurred during migration: {str(e)}")
            print("Attempting to initialize migrations...")
            init()
            print("Migrations initialized. Please run this script again.")

if __name__ == '__main__':
    run_migrations()
