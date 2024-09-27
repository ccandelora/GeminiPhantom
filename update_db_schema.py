import logging
from flask.cli import FlaskGroup
from app import app, db
from flask_migrate import Migrate, upgrade, init, migrate
from sqlalchemy import inspect
import os

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
                
                # Check if migrations directory exists
                if not os.path.exists('migrations'):
                    logging.info("Initializing migrations...")
                    init()
                
                # Create a new migration
                logging.info("Creating new migration...")
                migrate(directory='migrations', message="Add personality column to Session model")
                
                # Apply the migration
                logging.info("Applying migration...")
                upgrade(directory='migrations')
                
                logging.info("Migration for adding 'personality' column to Session model completed.")
                
                # Verify the column was added
                inspector = inspect(db.engine)
                if 'personality' in inspector.get_columns('session'):
                    logging.info("'personality' column successfully added to the 'session' table.")
                else:
                    logging.error("'personality' column was not added to the 'session' table.")
                    
                # Check database connection and permissions
                try:
                    db.session.execute("SELECT 1")
                    logging.info("Database connection successful.")
                except Exception as db_error:
                    logging.error(f"Database connection error: {str(db_error)}")
                
            except Exception as e:
                logging.error(f"An error occurred during migration: {str(e)}", exc_info=True)
        else:
            logging.info("'personality' column already exists in the 'session' table.")

if __name__ == '__main__':
    run_migrations()
