import logging
import traceback
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade, init, stamp, revision
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask app and database
app = Flask(__name__)
app.config.from_object('config.Config')
db = SQLAlchemy(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

def check_database_connection():
    try:
        db.session.execute(text("SELECT 1"))
        logging.info("Database connection successful.")
        return True
    except Exception as db_error:
        logging.error(f"Database connection error: {str(db_error)}")
        logging.error(traceback.format_exc())
        return False

def verify_column_exists(table_name, column_name):
    inspector = db.inspect(db.engine)
    columns = inspector.get_columns(table_name)
    return any(col['name'] == column_name for col in columns)

def log_database_schema(message):
    logging.info(message)
    inspector = db.inspect(db.engine)
    for table_name in inspector.get_table_names():
        logging.info(f"Table: {table_name}")
        for column in inspector.get_columns(table_name):
            logging.info(f"  Column: {column['name']} (Type: {column['type']})")

def create_migration():
    revision(autogenerate=True, message="Add personality column to session table")

def apply_migration():
    upgrade()

def init_migration():
    if not os.path.exists('migrations'):
        logging.info("Initializing migration environment...")
        init()
        stamp('head')
    else:
        logging.info("Migration environment already initialized.")

def run_migrations():
    logging.info("Starting migration process...")
    
    if not check_database_connection():
        logging.error("Unable to connect to the database. Please check your database configuration.")
        return

    log_database_schema("Current database schema:")

    if verify_column_exists('session', 'personality'):
        logging.info("'personality' column already exists in the 'session' table.")
        return

    try:
        init_migration()
        
        logging.info("Creating new migration...")
        create_migration()

        logging.info("Applying migration...")
        apply_migration()

        logging.info("Verifying changes...")
        if verify_column_exists('session', 'personality'):
            logging.info("'personality' column successfully added to the 'session' table.")
        else:
            logging.error("'personality' column was not added to the 'session' table.")
            logging.info("Attempting manual column addition...")
            try:
                with db.engine.connect() as connection:
                    connection.execute(text("ALTER TABLE session ADD COLUMN personality VARCHAR(64)"))
                logging.info("Manual column addition successful.")
            except Exception as manual_add_error:
                logging.error(f"Error in manual column addition: {str(manual_add_error)}")
                logging.error(traceback.format_exc())

        log_database_schema("Updated database schema:")

    except Exception as e:
        logging.error(f"An error occurred during migration: {str(e)}")
        logging.error(traceback.format_exc())

if __name__ == '__main__':
    with app.app_context():
        run_migrations()
