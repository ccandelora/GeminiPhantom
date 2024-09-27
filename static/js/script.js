document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded');
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const personalitySelect = document.getElementById('personality-select');
    const responseContainer = document.getElementById('response-container');
    const startVoiceInputButton = document.getElementById('start-voice-input');
    const toggleSpeechOutputButton = document.getElementById('toggle-speech-output');
    const microphoneIcon = document.createElement('span');
    microphoneIcon.innerHTML = '🎤';
    microphoneIcon.classList.add('hidden', 'ml-2', 'animate-pulse');
    startVoiceInputButton.appendChild(microphoneIcon);

    let recognition;
    let speechSynthesis = window.speechSynthesis;
    let isSpeechOutputEnabled = false;
    let voiceInputTimeout;

    // Check if Web Speech API is supported
    const isSpeechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const isSpeechSynthesisSupported = 'speechSynthesis' in window;

    console.log('Speech Recognition supported:', isSpeechRecognitionSupported);
    console.log('Speech Synthesis supported:', isSpeechSynthesisSupported);

    function updateButtonState(button, isEnabled, enabledText, disabledText, enabledClass, disabledClass) {
        button.disabled = !isEnabled;
        button.textContent = isEnabled ? enabledText : disabledText;
        button.className = button.className
            .split(' ')
            .filter(c => !c.startsWith('bg-'))
            .concat(isEnabled ? enabledClass.split(' ') : disabledClass.split(' '))
            .join(' ');
    }

    function checkBrowserCompatibility() {
        if (!isSpeechRecognitionSupported) {
            console.warn('Speech Recognition is not supported in this browser');
            displayErrorMessage('Speech Recognition is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.');
            updateButtonState(
                startVoiceInputButton,
                false,
                'Start Voice Input',
                'Voice Input Not Supported',
                'bg-blue-600 hover:bg-blue-700',
                'bg-gray-500'
            );
        }

        if (!isSpeechSynthesisSupported) {
            console.warn('Speech Synthesis is not supported in this browser');
            displayErrorMessage('Speech Synthesis is not supported in this browser. Please use a modern browser like Chrome, Edge, or Safari.');
            updateButtonState(
                toggleSpeechOutputButton,
                false,
                'Enable Speech Output',
                'Speech Output Not Supported',
                'bg-green-600 hover:bg-green-700',
                'bg-gray-500'
            );
        }
    }

    checkBrowserCompatibility();

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

    // Remove 'required' attribute from question input
    if (questionInput) {
        questionInput.removeAttribute('required');
    }

    async function handleQuestionSubmit(e) {
        e.preventDefault();
        console.log('Question form submitted');
        const question = questionInput.value.trim();
        const personality = personalitySelect.value;
        if (!question) {
            console.log('Empty question, not submitting');
            displayErrorMessage('Please enter a question before submitting.');
            return;
        }

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
            initializeSpeechRecognition();
        }

        if (recognition.state !== 'running') {
            startVoiceInput();
        } else {
            stopVoiceInput();
        }
    }

    function initializeSpeechRecognition() {
        console.log('Initializing speech recognition');
        try {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                updateButtonState(
                    startVoiceInputButton,
                    true,
                    'Stop Voice Input',
                    'Start Voice Input',
                    'bg-red-600 hover:bg-red-700',
                    'bg-blue-600 hover:bg-blue-700'
                );
                questionInput.placeholder = 'Listening...';
                microphoneIcon.classList.remove('hidden');
                
                // Set a timeout to stop voice input after 10 seconds
                voiceInputTimeout = setTimeout(() => {
                    console.log('Voice input timeout reached');
                    stopVoiceInput();
                }, 10000);
            };

            recognition.onresult = (event) => {
                console.log('Speech recognition result received');
                clearTimeout(voiceInputTimeout);
                const speechResult = event.results[0][0].transcript;
                questionInput.value = speechResult;
                console.log('Recognized speech:', speechResult);
                stopVoiceInput();
                questionForm.dispatchEvent(new Event('submit'));
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                clearTimeout(voiceInputTimeout);
                stopVoiceInput();
                displayErrorMessage(`Speech recognition error: ${event.error}. Please try again or use text input.`);
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                clearTimeout(voiceInputTimeout);
                stopVoiceInput();
            };
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            displayErrorMessage('Failed to initialize speech recognition. Please try again or use text input.');
        }
    }

    function startVoiceInput() {
        console.log('Starting voice input');
        try {
            questionInput.value = ''; // Clear previous questions
            recognition.start();
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log('Microphone permission granted');
                })
                .catch((error) => {
                    console.error('Microphone permission denied:', error);
                    displayErrorMessage('Microphone access is required for voice input. Please grant permission and try again, or use text input.');
                    stopVoiceInput();
                });
        } catch (error) {
            console.error('Error starting voice input:', error);
            displayErrorMessage('Failed to start voice input. Please try again or use text input.');
            stopVoiceInput();
        }
    }

    function stopVoiceInput() {
        console.log('Stopping voice input');
        try {
            if (recognition && recognition.state === 'running') {
                recognition.stop();
                console.log('Recognition stopped successfully');
            } else {
                console.log('Recognition was not running, no need to stop');
            }
        } catch (error) {
            console.error('Error stopping voice input:', error);
        } finally {
            updateButtonState(
                startVoiceInputButton,
                true,
                'Start Voice Input',
                'Start Voice Input',
                'bg-blue-600 hover:bg-blue-700',
                'bg-red-600 hover:bg-red-700'
            );
            questionInput.placeholder = 'Ask your question...';
            microphoneIcon.classList.add('hidden');
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
                displayErrorMessage('Failed to speak the response. Please try again or read the response.');
            }
        } else {
            console.error('Speech synthesis not supported');
            displayErrorMessage('Speech synthesis is not supported in your browser. Please read the response.');
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

    // Simple test function for Web Speech API
    function testWebSpeechAPI() {
        console.log('Testing Web Speech API');
        if (isSpeechRecognitionSupported) {
            const testRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            testRecognition.onstart = () => console.log('Test recognition started');
            testRecognition.onend = () => console.log('Test recognition ended');
            testRecognition.onerror = (event) => console.error('Test recognition error:', event.error);
            testRecognition.onresult = (event) => console.log('Test recognition result:', event.results[0][0].transcript);
            
            try {
                testRecognition.start();
                setTimeout(() => testRecognition.stop(), 5000); // Stop after 5 seconds
            } catch (error) {
                console.error('Error in test recognition:', error);
            }
        } else {
            console.error('Speech Recognition is not supported for testing');
        }

        if (isSpeechSynthesisSupported) {
            const testUtterance = new SpeechSynthesisUtterance('This is a test of speech synthesis.');
            testUtterance.onstart = () => console.log('Test synthesis started');
            testUtterance.onend = () => console.log('Test synthesis ended');
            testUtterance.onerror = (event) => console.error('Test synthesis error:', event.error);
            
            try {
                speechSynthesis.speak(testUtterance);
            } catch (error) {
                console.error('Error in test synthesis:', error);
            }
        } else {
            console.error('Speech Synthesis is not supported for testing');
        }
    }

    // Run the test function
    testWebSpeechAPI();
});
