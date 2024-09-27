import logging
from flask.cli import FlaskGroup
from app import app, db
from flask_migrate import Migrate, upgrade, init, migrate
from sqlalchemy import inspect

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask-Migrate
migrate = Migrate(app, db)

cli = FlaskGroup(app)

def run_migrations():
    with app.app_context():
        inspector = inspect(db.engine)
        if 'personality' not in inspector.get_columns('session'):
            try:
                logging.info("Starting migration process...")
                # Initialize migrations if not already done
                if not inspector.has_table('alembic_version'):
                    logging.info("Initializing migrations...")
                    init()
                
                # Create a new migration
                logging.info("Creating new migration...")
                migrate(message="Add personality column to Session model")
                
                # Apply the migration
                logging.info("Applying migration...")
                upgrade()
                
                logging.info("Migration for adding 'personality' column to Session model completed.")
                
                # Verify the column was added
                inspector = inspect(db.engine)
                if 'personality' in inspector.get_columns('session'):
                    logging.info("'personality' column successfully added to the 'session' table.")
                else:
                    logging.error("'personality' column was not added to the 'session' table.")
            except Exception as e:
                logging.error(f"An error occurred during migration: {str(e)}")
        else:
            logging.info("'personality' column already exists in the 'session' table.")

if __name__ == '__main__':
    run_migrations()
