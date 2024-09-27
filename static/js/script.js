document.addEventListener('DOMContentLoaded', () => {
    const questionForm = document.getElementById('question-form');
    const questionInput = document.getElementById('question-input');
    const personalitySelect = document.getElementById('personality-select');
    const responseContainer = document.getElementById('response-container');
    const loadingAnimation = document.getElementById('loading-animation');

    if (questionForm) {
        questionForm.addEventListener('submit', handleFormSubmit);
    }

    // Add floating symbols
    const floatingSymbols = document.getElementById('floating-symbols');
    const symbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '☽', '☀', '★'];
    for (let i = 0; i < 20; i++) {
        const symbol = document.createElement('div');
        symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        symbol.className = 'floating-symbol';
        symbol.style.left = `${Math.random() * 100}vw`;
        symbol.style.top = `${Math.random() * 100}vh`;
        symbol.style.animationDuration = `${10 + Math.random() * 10}s`;
        symbol.style.animationDelay = `-${Math.random() * 10}s`;
        floatingSymbols.appendChild(symbol);
    }

    // Add star field
    const starField = document.getElementById('star-field');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}vw`;
        star.style.top = `${Math.random() * 100}vh`;
        star.style.animationDuration = `${1 + Math.random() * 2}s`;
        star.style.animationDelay = `-${Math.random() * 2}s`;
        starField.appendChild(star);
    }

    // Debug logging for fog and candle-flame elements
    console.log('Fog element:', document.querySelector('.fog'));
    console.log('Candle flames:', document.querySelectorAll('.candle-flame'));
    console.log('Fog animation:', getComputedStyle(document.querySelector('.fog')).animation);
    console.log('Candle flame animation:', getComputedStyle(document.querySelector('.candle-flame')).backgroundImage);

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
