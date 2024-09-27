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

    // Check if Web Speech API is supported
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const isSpeechSynthesisSupported = 'speechSynthesis' in window;

    if (!isSpeechRecognitionSupported) {
        startVoiceInputButton.disabled = true;
        startVoiceInputButton.textContent = 'Voice Input Not Supported';
        startVoiceInputButton.classList.add('bg-gray-500');
    }

    if (!isSpeechSynthesisSupported) {
        toggleSpeechOutputButton.disabled = true;
        toggleSpeechOutputButton.textContent = 'Speech Output Not Supported';
        toggleSpeechOutputButton.classList.add('bg-gray-500');
    }

    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }

    if (startVoiceInputButton && isSpeechRecognitionSupported) {
        startVoiceInputButton.addEventListener('click', toggleVoiceInput);
    }

    if (toggleSpeechOutputButton && isSpeechSynthesisSupported) {
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
                stopVoiceInput();
                questionForm.dispatchEvent(new Event('submit'));
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                stopVoiceInput();
                displayErrorMessage('Speech recognition error. Please try again.');
            };

            recognition.onend = () => {
                stopVoiceInput();
            };
        }

        if (recognition.state === 'inactive') {
            startVoiceInput();
        } else {
            stopVoiceInput();
        }
    }

    function startVoiceInput() {
        recognition.start();
        startVoiceInputButton.textContent = 'Stop Voice Input';
        startVoiceInputButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        startVoiceInputButton.classList.add('bg-red-600', 'hover:bg-red-700');
        questionInput.placeholder = 'Listening...';
    }

    function stopVoiceInput() {
        recognition.stop();
        startVoiceInputButton.textContent = 'Start Voice Input';
        startVoiceInputButton.classList.remove('bg-red-600', 'hover:bg-red-700');
        startVoiceInputButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
        questionInput.placeholder = 'Ask your question...';
    }

    function toggleSpeechOutput(e) {
        e.preventDefault();
        isSpeechOutputEnabled = !isSpeechOutputEnabled;
        toggleSpeechOutputButton.textContent = isSpeechOutputEnabled ? 'Disable Speech Output' : 'Enable Speech Output';
        toggleSpeechOutputButton.classList.toggle('bg-green-600');
        toggleSpeechOutputButton.classList.toggle('bg-red-600');
    }

    function speakResponse(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        } else {
            console.error('Speech synthesis not supported');
            displayErrorMessage('Speech synthesis is not supported in your browser.');
        }
    }

    function displayErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message', 'mb-4', 'p-4', 'bg-red-600', 'rounded-lg', 'shadow-md');
        errorElement.textContent = message;
        responseContainer.prepend(errorElement);
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
