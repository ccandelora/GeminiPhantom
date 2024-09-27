document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const personalitySelect = document.getElementById('personality-select');
    const responseContainer = document.getElementById('response-container');
    const startVoiceInputButton = document.getElementById('start-voice-input');
    const toggleSpeechOutputButton = document.getElementById('toggle-speech-output');

    let recognition;
    let speechSynthesis = window.speechSynthesis;
    let isSpeechOutputEnabled = false;

    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }

    if (startVoiceInputButton) {
        startVoiceInputButton.addEventListener('click', toggleVoiceInput);
    }

    if (toggleSpeechOutputButton) {
        toggleSpeechOutputButton.addEventListener('click', toggleSpeechOutput);
    }

    async function handleQuestionSubmit(e) {
        e.preventDefault();
        const question = questionInput.value.trim();
        const personality = personalitySelect.value;
        if (!question) return;

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question, personality }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();
            displayResponse(question, data.response, data.personality);
            questionInput.value = '';

            if (isSpeechOutputEnabled) {
                speakResponse(data.response);
            }
        } catch (error) {
            console.error('Error:', error);
            displayResponse(question, `An error occurred: ${error.message}. Please try again later.`, 'Error');
        }
    }

    function displayResponse(question, response, personality) {
        const responseElement = document.createElement('div');
        responseElement.classList.add('psychic-response', 'mb-4', 'p-4', 'bg-purple-900', 'rounded-lg', 'shadow-md');
        responseElement.innerHTML = `
            <p class="text-gray-400 mb-2">You asked ${personality}:</p>
            <p class="text-gray-300 mb-2">${question}</p>
            <p class="text-white italic">"${response}"</p>
        `;
        responseContainer.prepend(responseElement);

        responseElement.offsetHeight;
        responseElement.classList.add('show');

        responseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function toggleVoiceInput(e) {
        e.preventDefault();
        if (!recognition) {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const speechResult = event.results[0][0].transcript;
                questionInput.value = speechResult;
                recognition.stop();
                startVoiceInputButton.textContent = 'Start Voice Input';
                questionForm.dispatchEvent(new Event('submit'));
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                startVoiceInputButton.textContent = 'Start Voice Input';
            };

            recognition.onend = () => {
                startVoiceInputButton.textContent = 'Start Voice Input';
            };
        }

        if (recognition.state === 'inactive') {
            recognition.start();
            startVoiceInputButton.textContent = 'Stop Voice Input';
        } else {
            recognition.stop();
            startVoiceInputButton.textContent = 'Start Voice Input';
        }
    }

    function toggleSpeechOutput(e) {
        e.preventDefault();
        isSpeechOutputEnabled = !isSpeechOutputEnabled;
        toggleSpeechOutputButton.textContent = isSpeechOutputEnabled ? 'Disable Speech Output' : 'Enable Speech Output';
    }

    function speakResponse(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }
});
