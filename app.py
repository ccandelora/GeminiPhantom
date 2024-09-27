import os
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

app = Flask(__name__)

# Load configuration
app.config.from_object('config.Config')

# Configure Google Gemini API
genai.configure(api_key=app.config['GEMINI_API_KEY'])
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ask', methods=['POST'])
def ask_psychic():
    question = request.json['question']
    
    # Prompt engineering for psychic medium simulation
    prompt = f"As a psychic medium, provide a mystical and intuitive response to the following question: '{question}'. Be vague yet comforting, and use language that a psychic medium might use."
    
    response = model.generate_content(prompt)
    
    return jsonify({'response': response.text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
