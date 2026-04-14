document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Create typing indicator element
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    
    // Auto-scroll to bottom
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // AI Responses based on keywords
    const getAiResponse = (message) => {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('gate') && (lowerMsg.includes('less') || lowerMsg.includes('least') || lowerMsg.includes('crowded'))) {
            return "Gate B has the least crowd right now. I recommend heading there for a faster entry!";
        } else if (lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('hungry')) {
            return "There are food stalls available on Level 1 and Level 2. The pizza stand on Level 2 currently has the shortest line.";
        } else if (lowerMsg.includes('washroom') || lowerMsg.includes('restroom') || lowerMsg.includes('toilet')) {
            return "The nearest restrooms are located near Section 104, just down the hall to your right.";
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return "Hello there! How can I assist you with the venue today?";
        } else if (lowerMsg.includes('parking')) {
            return "Parking Lot C still has plenty of open spots. Can I help you with directions there?";
        } else {
            return "I'm not entirely sure about that, but please check the venue map located near the main entrances or ask our on-site staff for more help.";
        }
    };

    // Function to add a message to the chat UI
    const addMessage = (text, isUser) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        let innerHTML = '';
        if (!isUser) {
            innerHTML += '<div class="avatar">AI</div>';
        }
        
        innerHTML += `
            <div class="message-content">
                <p>${text}</p>
            </div>
        `;
        
        messageDiv.innerHTML = innerHTML;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    };

    // Handle send button click
    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage(text, true);
        userInput.value = '';
        
        // Show typing indicator
        chatMessages.appendChild(typingIndicator);
        typingIndicator.classList.add('active');
        scrollToBottom();

        // Simulate network delay for AI response
        setTimeout(() => {
            // Remove typing indicator
            typingIndicator.classList.remove('active');
            if (typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }
            
            // Add AI response
            const aiResponse = getAiResponse(text);
            addMessage(aiResponse, false);
        }, 1200 + Math.random() * 800); // Random delay between 1.2s and 2s
    };

    // Event listeners
    sendBtn.addEventListener('click', handleSend);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Focus input on load
    userInput.focus();
});
