import logging
import traceback
from flask.cli import FlaskGroup
from app import app, db
from flask_migrate import Migrate, upgrade, init, migrate
from sqlalchemy import inspect
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask-Migrate
migrate = Migrate(app, db)

cli = FlaskGroup(app)

def check_database_connection():
    try:
        db.session.execute("SELECT 1")
        logging.info("Database connection successful.")
        return True
    except Exception as db_error:
        logging.error(f"Database connection error: {str(db_error)}")
        logging.error(traceback.format_exc())
        return False

def verify_column_exists(table_name, column_name):
    inspector = inspect(db.engine)
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

def run_migrations():
    with app.app_context():
        if not check_database_connection():
            logging.error("Unable to connect to the database. Please check your database configuration.")
            return

        if verify_column_exists('session', 'personality'):
            logging.info("'personality' column already exists in the 'session' table.")
            return

        try:
            logging.info("Starting migration process...")
            
            if not os.path.exists('migrations'):
                logging.info("Initializing migrations...")
                init()
            
            logging.info("Creating new migration...")
            migrate(directory='migrations', message="Add personality column to Session model")
            
            logging.info("Applying migration...")
            upgrade(directory='migrations')
            
            logging.info("Migration completed. Verifying changes...")
            
            if verify_column_exists('session', 'personality'):
                logging.info("'personality' column successfully added to the 'session' table.")
            else:
                logging.error("'personality' column was not added to the 'session' table.")
                logging.error("Please check the migration file and database permissions.")
            
        except Exception as e:
            logging.error(f"An error occurred during migration: {str(e)}")
            logging.error(traceback.format_exc())

if __name__ == '__main__':
    run_migrations()
