document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const personalitySelect = document.getElementById('personality-select');
    const responseContainer = document.getElementById('response-container');
    const loadingAnimation = document.getElementById('loading-animation');

    if (questionForm) {
        questionForm.addEventListener('submit', handleFormSubmit);
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
});
