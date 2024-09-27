document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const personalitySelect = document.getElementById('personality-select');
    const responseContainer = document.getElementById('response-container');
    const loadingAnimation = document.getElementById('loading-animation');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');

    let mediaRecorder;
    let audioChunks = [];

    if (questionForm) {
        questionForm.addEventListener('submit', handleFormSubmit);
    }

    if (startRecordingBtn) {
        startRecordingBtn.addEventListener('click', startRecording);
    }

    if (stopRecordingBtn) {
        stopRecordingBtn.addEventListener('click', stopRecording);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const question = questionInput.value.trim();
        const personality = personalitySelect.value;
        if (!question) return;

        await askQuestion(question, personality);
    }

    async function askQuestion(question, personality) {
        loadingAnimation.classList.remove('hidden');

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

            // Convert response to speech
            await textToSpeech(data.response);
        } catch (error) {
            console.error('Error:', error);
            displayResponse(question, `An error occurred: ${error.message}. Please try again later.`, 'Error');
        } finally {
            loadingAnimation.classList.add('hidden');
        }
    }

    function displayResponse(question, response, personality) {
        const responseElement = document.createElement('div');
        responseElement.classList.add('psychic-response', 'mb-4', 'p-4', 'bg-purple-900', 'rounded-lg', 'shadow-md');
        responseElement.innerHTML = `
            <p class="text-gray-400 mb-2">You asked: ${question}</p>
            <p class="text-gray-400 mb-2">Psychic: ${personality}</p>
            <p class="text-white">${response}</p>
        `;
        responseContainer.prepend(responseElement);

        responseElement.offsetHeight;
        responseElement.classList.add('show');

        responseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await speechToText(audioBlob);
                audioChunks = [];
            };

            mediaRecorder.start();
            startRecordingBtn.style.display = 'none';
            stopRecordingBtn.style.display = 'inline-block';
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            startRecordingBtn.style.display = 'inline-block';
            stopRecordingBtn.style.display = 'none';
        }
    }

    async function speechToText(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        try {
            const response = await fetch('/speech_to_text', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Speech to text conversion failed');
            }

            const data = await response.json();
            questionInput.value = data.text;
        } catch (error) {
            console.error('Error converting speech to text:', error);
        }
    }

    async function textToSpeech(text) {
        try {
            const response = await fetch('/text_to_speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error('Text to speech conversion failed');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (error) {
            console.error('Error converting text to speech:', error);
        }
    }
});
