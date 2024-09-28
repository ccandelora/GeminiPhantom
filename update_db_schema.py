from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import your models here
from models import User, Session

if __name__ == '__main__':
    with app.app_context():
        from flask_migrate import init, migrate, upgrade
        if not os.path.exists('migrations'):
            init()
        migrate(message="Add personality column to session table")
        upgrade()
