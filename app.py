import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
import google.generativeai as genai
from models import db, User, Session

app = Flask(__name__)

# Load configuration
app.config.from_object('config.Config')

# Initialize database
db.init_app(app)

# Initialize LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Configure Google Gemini API
genai.configure(api_key=app.config['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful. Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash('Logged in successfully.', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully.', 'success')
    return redirect(url_for('index'))

@app.route('/ask', methods=['POST'])
@login_required
def ask_psychic():
    question = request.json['question']
    
    # Prompt engineering for psychic medium simulation
    prompt = f"As a psychic medium, provide a mystical and intuitive response to the following question: '{question}'. Be vague yet comforting, and use language that a psychic medium might use."
    
    response = model.generate_content(prompt)
    
    # Save the session
    session = Session(user_id=current_user.id, question=question, response=response.text)
    db.session.add(session)
    db.session.commit()
    
    return jsonify({'response': response.text})

@app.route('/past_sessions')
@login_required
def past_sessions():
    sessions = current_user.sessions.order_by(Session.timestamp.desc()).all()
    return render_template('past_sessions.html', sessions=sessions)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
