import logging
import traceback
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade, init, stamp
from flask.cli import with_appcontext
from sqlalchemy import inspect

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

@with_appcontext
def run_migrations():
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
            stamp('head')
        
        logging.info("Creating new migration...")
        migrate_obj = Migrate(app, db)
        with app.app_context():
            migrate_obj.init_app(app, db)
            migrate_obj.migrate()
        
        logging.info("Applying migration...")
        upgrade()
        
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
    with app.app_context():
        run_migrations()
