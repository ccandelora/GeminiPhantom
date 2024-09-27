import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_migrate import Migrate
import google.generativeai as genai
from models import db, User, Session
import logging
import random
import time
from tenacity import retry, stop_after_attempt, wait_exponential

app = Flask(__name__)

app.config.from_object('config.Config')

db.init_app(app)

migrate = Migrate(app, db)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

genai.configure(api_key=app.config['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-pro')

logging.basicConfig(level=logging.INFO)

PSYCHIC_PERSONALITIES = [
    {
        "name": "Madame Zara",
        "description": "A mysterious fortune teller with a thick Eastern European accent.",
        "traits": "mysterious, dramatic, speaks in riddles"
    },
    {
        "name": "Sage Willow",
        "description": "A calm and earthy nature-connected medium.",
        "traits": "serene, nature-oriented, speaks softly"
    },
    {
        "name": "Professor Enigma",
        "description": "An eccentric academic with a flair for the paranormal.",
        "traits": "intellectual, quirky, uses scientific terms"
    },
    {
        "name": "Luna Stargazer",
        "description": "A dreamy astrologer who connects with celestial energies.",
        "traits": "whimsical, star-focused, speaks poetically"
    }
]

@app.route('/')
def index():
    app.logger.info(f"User authentication status: {current_user.is_authenticated}")
    return render_template('index.html', personalities=PSYCHIC_PERSONALITIES)

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

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def generate_psychic_response(prompt):
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        app.logger.error(f"Error generating response from Gemini API: {str(e)}")
        raise

@app.route('/ask', methods=['POST'])
@login_required
def ask_psychic():
    question = request.json['question']
    personality_name = request.json.get('personality', random.choice(PSYCHIC_PERSONALITIES)['name'])
    
    try:
        app.logger.info(f"Received question: {question} for personality: {personality_name}")
        
        personality = next((p for p in PSYCHIC_PERSONALITIES if p['name'] == personality_name), None)
        if not personality:
            raise ValueError("Invalid personality selected")
        
        prompt = f"As {personality['name']}, a psychic medium who is {personality['traits']}, provide a mystical and intuitive response to the following question: '{question}'. Embody the personality's unique traits in your response."
        
        app.logger.info("Sending request to Gemini API")
        try:
            answer = generate_psychic_response(prompt)
            app.logger.info(f"Received response from Gemini API: {answer}")
        except Exception as api_error:
            app.logger.error(f"Gemini API error after retries: {str(api_error)}")
            raise

        session = Session(user_id=current_user.id, question=question, response=answer, personality=personality_name)
        db.session.add(session)
        db.session.commit()
        app.logger.info("Session saved to database")
        
        return jsonify({'response': answer, 'personality': personality['name']})
    
    except Exception as e:
        app.logger.error(f"Error generating psychic response: {str(e)}", exc_info=True)
        error_message = "The spirits are unclear at this moment. Please try again later."
        return jsonify({'error': error_message}), 500

@app.route('/past_sessions')
@login_required
def past_sessions():
    sessions = current_user.sessions.order_by(Session.timestamp.desc()).all()
    return render_template('past_sessions.html', sessions=sessions, personalities=PSYCHIC_PERSONALITIES)

@app.route('/test', methods=['GET'])
def test_endpoint():
    return jsonify({'status': 'ok', 'message': 'Test endpoint is working'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
