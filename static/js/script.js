document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const responseContainer = document.getElementById('response-container');

    if (questionForm) {
        questionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = questionInput.value.trim();
            if (!question) return;

            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question }),
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        // User is not authenticated, redirect to login page
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                displayResponse(question, data.response);
                questionInput.value = '';
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while communicating with the psychic realm. Please try again.');
            }
        });
    }

    function displayResponse(question, response) {
        const responseElement = document.createElement('div');
        responseElement.classList.add('psychic-response', 'mb-4', 'p-4', 'bg-purple-900', 'rounded-lg', 'shadow-md');
        responseElement.innerHTML = `
            <p class="text-gray-400 mb-2">You asked: ${question}</p>
            <p class="text-white">${response}</p>
        `;
        responseContainer.prepend(responseElement);

        // Trigger reflow to ensure the transition applies
        responseElement.offsetHeight;
        responseElement.classList.add('show');

        // Scroll to the new response
        responseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
