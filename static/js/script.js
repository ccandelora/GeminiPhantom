document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
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

    console.log('Speech Recognition supported:', isSpeechRecognitionSupported);
    console.log('Speech Synthesis supported:', isSpeechSynthesisSupported);

    function updateButtonState(button, isEnabled, enabledText, disabledText, enabledClass, disabledClass) {
        button.disabled = !isEnabled;
        button.textContent = isEnabled ? enabledText : disabledText;
        button.classList.remove(isEnabled ? disabledClass : enabledClass);
        button.classList.add(isEnabled ? enabledClass : disabledClass);
    }

    updateButtonState(
        startVoiceInputButton,
        isSpeechRecognitionSupported,
        'Start Voice Input',
        'Voice Input Not Supported',
        'bg-blue-600 hover:bg-blue-700',
        'bg-gray-500'
    );

    updateButtonState(
        toggleSpeechOutputButton,
        isSpeechSynthesisSupported,
        'Enable Speech Output',
        'Speech Output Not Supported',
        'bg-green-600 hover:bg-green-700',
        'bg-gray-500'
    );

    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
        console.log('Question form submit event listener attached');
    }

    if (startVoiceInputButton && isSpeechRecognitionSupported) {
        startVoiceInputButton.addEventListener('click', toggleVoiceInput);
        console.log('Start voice input button click event listener attached');
    }

    if (toggleSpeechOutputButton && isSpeechSynthesisSupported) {
        toggleSpeechOutputButton.addEventListener('click', toggleSpeechOutput);
        console.log('Toggle speech output button click event listener attached');
    }

    async function handleQuestionSubmit(e) {
        e.preventDefault();
        console.log('Question form submitted');
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
            displayErrorMessage(`An error occurred: ${error.message}. Please try again later.`);
        }
    }

    function displayResponse(question, response, personality) {
        console.log('Displaying response');
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
        console.log('Toggle voice input clicked');
        if (!recognition) {
            try {
                recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event) => {
                    console.log('Speech recognition result received');
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
                    console.log('Speech recognition ended');
                    stopVoiceInput();
                };
            } catch (error) {
                console.error('Error initializing speech recognition:', error);
                displayErrorMessage('Failed to initialize speech recognition. Please try again.');
                return;
            }
        }

        if (recognition.state !== 'running') {
            startVoiceInput();
        } else {
            stopVoiceInput();
        }
    }

    function startVoiceInput() {
        console.log('Starting voice input');
        try {
            recognition.start();
            updateButtonState(
                startVoiceInputButton,
                true,
                'Stop Voice Input',
                'Start Voice Input',
                'bg-red-600 hover:bg-red-700',
                'bg-blue-600 hover:bg-blue-700'
            );
            questionInput.placeholder = 'Listening...';
        } catch (error) {
            console.error('Error starting voice input:', error);
            displayErrorMessage('Failed to start voice input. Please try again.');
        }
    }

    function stopVoiceInput() {
        console.log('Stopping voice input');
        try {
            recognition.stop();
            updateButtonState(
                startVoiceInputButton,
                true,
                'Start Voice Input',
                'Start Voice Input',
                'bg-blue-600 hover:bg-blue-700',
                'bg-red-600 hover:bg-red-700'
            );
            questionInput.placeholder = 'Ask your question...';
        } catch (error) {
            console.error('Error stopping voice input:', error);
            displayErrorMessage('Failed to stop voice input. Please refresh the page and try again.');
        }
    }

    function toggleSpeechOutput(e) {
        e.preventDefault();
        console.log('Toggle speech output clicked');
        isSpeechOutputEnabled = !isSpeechOutputEnabled;
        updateButtonState(
            toggleSpeechOutputButton,
            true,
            isSpeechOutputEnabled ? 'Disable Speech Output' : 'Enable Speech Output',
            'Enable Speech Output',
            isSpeechOutputEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700',
            isSpeechOutputEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
        );
    }

    function speakResponse(text) {
        console.log('Speaking response');
        if ('speechSynthesis' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('Error in speech synthesis:', error);
                displayErrorMessage('Failed to speak the response. Please try again.');
            }
        } else {
            console.error('Speech synthesis not supported');
            displayErrorMessage('Speech synthesis is not supported in your browser.');
        }
    }

    function displayErrorMessage(message) {
        console.error('Displaying error message:', message);
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message', 'mb-4', 'p-4', 'bg-red-600', 'rounded-lg', 'shadow-md');
        errorElement.textContent = message;
        responseContainer.prepend(errorElement);
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
