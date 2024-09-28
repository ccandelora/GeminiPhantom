from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate, upgrade, init, stamp, revision
import os
from models import User, Session

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
db = SQLAlchemy(app)
migrate = Migrate(app, db)

if __name__ == '__main__':
    with app.app_context():
        if not os.path.exists('migrations'):
            init()
            stamp('head')
        revision_message = "Add personality column to session table"
        revision(autogenerate=True, message=revision_message)
        upgrade()

        # Verify the changes
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        columns = inspector.get_columns('session')
        column_names = [column['name'] for column in columns]
        if 'personality' in column_names:
            print("Migration successful: 'personality' column added to 'session' table.")
        else:
            print("Migration failed: 'personality' column not found in 'session' table.")
