document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Create typing indicator element
    const typingIndicator = document.createElement('div');
    // Using the same style but with explicit text
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
        <span style="font-size: 0.9rem; font-style: italic; color: #a0a6b1;">Assistant is typing...</span>
    `;
    
    // Auto-scroll to bottom
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Venue Data for Intelligent Responses
    const venueData = {
        gates: [
            { name: "Gate A", crowd: "high", score: 3, clearingTime: 10 },
            { name: "Gate B", crowd: "low", score: 1, clearingTime: 5 },
            { name: "Gate C", crowd: "medium", score: 2, clearingTime: 8 }
        ],
        foodStalls: [
            { name: "Food Stall A", waitTime: 15 },
            { name: "Food Stall B", waitTime: 5 }
        ]
    };

    let lastContext = "";

    // AI Responses based on keywords and venue data
    const getAiResponse = (message) => {
        const lowerMsg = message.toLowerCase();
        
        // Analyze data to find best options
        const allGatesCrowded = venueData.gates.every(g => g.crowd === 'high');
        const bestGate = venueData.gates.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr);
        const fastestClearingGate = venueData.gates.reduce((prev, curr) => (prev.clearingTime < curr.clearingTime) ? prev : curr);
        const bestFood = venueData.foodStalls.reduce((prev, curr) => (prev.waitTime < curr.waitTime) ? prev : curr);

        if (lowerMsg.includes('gate') || lowerMsg.includes('crowd')) {
            let prefix = lastContext === "food" ? "Now that you're fed, let's find the best entry! " : "";
            lastContext = "gate";
            
            if (allGatesCrowded) {
                if (lowerMsg.includes('best') || lowerMsg.includes('fastest') || lowerMsg.includes('recommend') || lowerMsg.includes('which')) {
                    return `${fastestClearingGate.name} will be less crowded in about ${fastestClearingGate.clearingTime} minutes.`;
                } else {
                    return "All gates are currently crowded. You can wait for a few minutes or try after some time.";
                }
            }

            return `${prefix}Based on current data, ${bestGate.name} is your best option. It currently has a ${bestGate.crowd} crowd.`;
        } else if (lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('wait') || lowerMsg.includes('time') || lowerMsg.includes('hungry')) {
            let prefix = lastContext === "gate" ? "Great idea to get some food after sorting out your gate! " : "";
            lastContext = "food";
            return `${prefix}For the shortest waiting time, I recommend ${bestFood.name}. The current wait is only ${bestFood.waitTime} minutes.`;
        } else if (lowerMsg.includes('where should i go') || lowerMsg.includes('recommend') || lowerMsg.includes('best option')) {
            lastContext = "general";
            
            if (allGatesCrowded) {
                return `All gates are highly crowded right now. I'd strongly suggest getting food first since ${bestFood.name} has only a ${bestFood.waitTime} min wait.`;
            }
            return `If you are arriving, head to ${bestGate.name} (${bestGate.crowd} crowd). If you're looking for food, go to ${bestFood.name} (${bestFood.waitTime} min wait).`;
        } else if (lowerMsg.includes('washroom') || lowerMsg.includes('restroom') || lowerMsg.includes('toilet')) {
            lastContext = "washroom";
            return "The nearest restrooms are located near Section 104, just down the hall to your right.";
        } else if (lowerMsg.includes('what about') || lowerMsg.includes('how about')) {
            if (lastContext === "gate") {
                lastContext = "food";
                return `Are you asking about food stalls? Great idea to grab a bite! ${bestFood.name} has the shortest wait (${bestFood.waitTime} mins).`;
            } else if (lastContext === "food") {
                lastContext = "gate";
                return `Are you asking about the gates? For entry, ${bestGate.name} is your best option.`;
            }
        }
        
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return "Hello there! How can I assist you today? You can ask me about gate crowds, food wait times, or general directions.";
        } else {
            return "Sorry, I can help with crowd and navigation queries inside the venue.";
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
        }, 1000); // Exact 1 second delay
    };

    // Event listeners
    sendBtn.addEventListener('click', handleSend);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Initialization Sequence (Proactive Recommendation & Alerts)
    const initSequence = () => {
        const allGatesCrowded = venueData.gates.every(g => g.crowd === 'high');
        const bestGate = venueData.gates.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr);
        const bestFood = venueData.foodStalls.reduce((prev, curr) => (prev.waitTime < curr.waitTime) ? prev : curr);
        
        let welcomeMsg = `Welcome! ${bestGate.name} is currently the least crowded. ${bestFood.name} has the shortest wait time.`;
        if (allGatesCrowded) {
            welcomeMsg = `Welcome! All gates are currently crowded. ${bestFood.name} has the shortest wait time.`;
        }
        
        const highCrowdGates = venueData.gates.filter(g => g.crowd === 'high');
        
        const queue = [welcomeMsg];
        highCrowdGates.forEach(g => {
            queue.push(`⚠️ ${g.name} is highly crowded. Please avoid this route.`);
        });

        // Queue messages sequentially
        queue.forEach((msg, index) => {
            setTimeout(() => {
                chatMessages.appendChild(typingIndicator);
                typingIndicator.classList.add('active');
                scrollToBottom();
                
                setTimeout(() => {
                    typingIndicator.classList.remove('active');
                    if (typingIndicator.parentNode) {
                        typingIndicator.parentNode.removeChild(typingIndicator);
                    }
                    addMessage(msg, false);
                }, 1000);
            }, index * 1500);
        });
    };

    // Run proactive logic
    initSequence();
    
    // Focus input on load
    userInput.focus();
});
