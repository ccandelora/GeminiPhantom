import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_file
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
import google.generativeai as genai
from models import db, User, Session
import logging
import random
import speech_recognition as sr
import pyttsx3
import tempfile

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

# Configure logging
logging.basicConfig(level=logging.INFO)

# Define psychic medium personalities
PSYCHIC_PERSONALITIES = {
    'mystic_seer': {
        'name': 'Mystic Seer',
        'prompt': "As the Mystic Seer, you possess the ability to peer into the cosmic tapestry of fate. Your responses are cryptic yet profound, often referencing celestial bodies and the ebb and flow of cosmic energies. Provide a mystical and intuitive response to the following question: '{question}'. Be vague yet comforting, and use language that a mystic seer might use."
    },
    'spirit_whisperer': {
        'name': 'Spirit Whisperer',
        'prompt': "As the Spirit Whisperer, you have a unique connection to the realm of departed souls. Your responses often include messages or impressions from loved ones who have passed on. Provide a comforting and insightful response to the following question: '{question}'. Be gentle and empathetic, using language that a medium communicating with spirits might use."
    },
    'fortune_teller': {
        'name': 'Fortune Teller',
        'prompt': "As the Fortune Teller, you have the gift of foresight and can glimpse potential futures. Your responses often include predictions or warnings about upcoming events. Provide an intriguing and forward-looking response to the following question: '{question}'. Be dramatic yet cautious, using language that a fortune teller might use."
    },
    'tarot_master': {
        'name': 'Tarot Master',
        'prompt': "As the Tarot Master, you possess deep wisdom of the arcane symbolism in tarot cards. Your responses often reference specific tarot cards and their meanings. Provide an insightful interpretation to the following question: '{question}'. Be symbolic and thought-provoking, using language that a tarot reader might use."
    }
}

@app.route('/')
def index():
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

@app.route('/ask', methods=['POST'])
@login_required
def ask_psychic():
    try:
        question = request.json['question']
        personality_key = request.json.get('personality', 'random')
        
        if personality_key == 'random':
            personality_key = random.choice(list(PSYCHIC_PERSONALITIES.keys()))
        
        personality = PSYCHIC_PERSONALITIES[personality_key]
        
        app.logger.info(f"Received question: {question}")
        prompt = personality['prompt'].format(question=question)
        
        app.logger.info("Sending request to Gemini API")
        response = model.generate_content(prompt)
        app.logger.info(f"Received response from Gemini API: {response}")

        if response.parts:
            answer = response.text
            app.logger.info(f"Processed answer: {answer}")
            
            # Save the session
            session = Session(user_id=current_user.id, question=question, response=answer, personality=personality['name'])
            db.session.add(session)
            db.session.commit()
            app.logger.info("Session saved to database")
            
            return jsonify({'response': answer, 'personality': personality['name']})
        else:
            raise ValueError("No content in the response")
    
    except Exception as e:
        app.logger.error(f"Error in ask_psychic: {str(e)}", exc_info=True)
        error_message = "The spirits are unclear at this moment. Please try again later."
        return jsonify({'error': error_message}), 500

@app.route('/past_sessions')
@login_required
def past_sessions():
    sessions = current_user.sessions.order_by(Session.timestamp.desc()).all()
    return render_template('past_sessions.html', sessions=sessions)

@app.route('/speech_to_text', methods=['POST'])
@login_required
def speech_to_text():
    try:
        audio_file = request.files['audio']
        recognizer = sr.Recognizer()
        
        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        return jsonify({'text': text})
    except Exception as e:
        app.logger.error(f"Error in speech_to_text: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to convert speech to text'}), 500

@app.route('/text_to_speech', methods=['POST'])
@login_required
def text_to_speech():
    try:
        text = request.json['text']
        engine = pyttsx3.init()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            temp_filename = temp_file.name
            engine.save_to_file(text, temp_filename)
            engine.runAndWait()
        
        return send_file(temp_filename, as_attachment=True, download_name='response.mp3')
    except Exception as e:
        app.logger.error(f"Error in text_to_speech: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to convert text to speech'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
