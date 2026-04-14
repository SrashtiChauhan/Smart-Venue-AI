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
            { name: "Gate A", crowd: "high", score: 3, clearingTime: 10, location: "near the north plaza" },
            { name: "Gate B", crowd: "low", score: 1, clearingTime: 5, location: "near the main entrance on the east side of the stadium" },
            { name: "Gate C", crowd: "medium", score: 2, clearingTime: 8, location: "at the south end, close to the parking lot" }
        ],
        foodStalls: [
            { name: "Food Stall A", waitTime: 15, location: "by the upper deck seating area" },
            { name: "Food Stall B", waitTime: 5, location: "near the central concourse" },
            { name: "Food Stall C", waitTime: 20, location: "next to the merchandise shop" }
        ]
    };

    let lastContext = "";

    const getRandomResponse = (responses) => {
        return responses[Math.floor(Math.random() * responses.length)];
    };

    // AI Responses based on keywords and venue data
    const getAiResponse = (message) => {
        const lowerMsg = message.toLowerCase();
        
        // Analyze data to find best options
        const allGatesCrowded = venueData.gates.every(g => g.crowd === 'high');
        const bestGate = venueData.gates.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr);
        const fastestClearingGate = venueData.gates.reduce((prev, curr) => (prev.clearingTime < curr.clearingTime) ? prev : curr);
        const bestFood = venueData.foodStalls.reduce((prev, curr) => (prev.waitTime < curr.waitTime) ? prev : curr);
        
        // Explicit Entity Matching
        let explicitGate = venueData.gates.find(g => lowerMsg.includes(g.name.toLowerCase()));
        let explicitFood = venueData.foodStalls.find(f => lowerMsg.includes(f.name.toLowerCase()));
        
        let targetGate = explicitGate || bestGate;
        let targetFood = explicitFood || bestFood;

        // Explicit Edge Case 1: All crowded inquiries
        if (lowerMsg.includes('all gates are crowded') || lowerMsg.includes('everything is crowded')) {
             lastContext = "gate";
             return `All gates are currently crowded. I recommend waiting for a few minutes. ${fastestClearingGate.name} is expected to clear in about ${fastestClearingGate.clearingTime} minutes.`;
        }

        // Improved Intent Detection
        let wantsGeneral = lowerMsg.includes('where should i go') || lowerMsg.includes('recommend') || lowerMsg.includes('best option');
        let wantsFood = lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('hungry') || lowerMsg.includes('wait') || lowerMsg.includes('time') || lowerMsg.includes('stall');
        
        let wantsGate = lowerMsg.includes('gate') || lowerMsg.includes('go') || lowerMsg.includes('entry');
        if (lowerMsg.includes('crowd') && !wantsFood && !wantsGeneral) {
            wantsGate = true;
        }

        // Handle Location Inquiries
        const cleanMsgLoc = lowerMsg.replace(/[^a-z ]/g, "").trim();
        const isLocationQuery = ["where is it", "where is that", "location"].includes(cleanMsgLoc) || lowerMsg.includes('where is it') || lowerMsg.includes('where is that') || (lowerMsg.includes('where is') && !lowerMsg.includes('should i go')) || lowerMsg.includes('location');
        
        // Fast-path explicit status checks if they aren't asking for location
        if (!isLocationQuery && explicitGate && !explicitFood) {
            lastContext = "gate";
            return `${explicitGate.name} currently has a ${explicitGate.crowd} crowd level.`;
        }
        if (!isLocationQuery && explicitFood && !explicitGate) {
            lastContext = "food";
            return `The wait time at ${explicitFood.name} is currently ${explicitFood.waitTime} minutes.`;
        }

        if (isLocationQuery) {
            if (lastContext === "general" || (wantsGate && wantsFood)) {
                return `${targetGate.name} is located ${targetGate.location}, and ${targetFood.name} is located ${targetFood.location}.`;
            } else if (wantsGate || explicitGate || (!wantsFood && lastContext === "gate")) {
                return `${targetGate.name} is located ${targetGate.location}.`;
            } else if (wantsFood || explicitFood || (!wantsGate && lastContext === "food")) {
                return `${targetFood.name} is located ${targetFood.location}.`;
            } else {
                return `${targetGate.name} is located ${targetGate.location}, and ${targetFood.name} is located ${targetFood.location}.`;
            }
        }

        // Handle Conversational Follow-ups using Context
        const cleanMsg = lowerMsg.replace(/[^a-z ]/g, "").trim();
        const isShortFollowUp = ["and now", "now", "what now", "so now"].includes(cleanMsg);
        const isFollowUp = lowerMsg.includes('what about') || lowerMsg.includes('how about') || isShortFollowUp;

        if (isFollowUp && !wantsGate && !wantsFood && !wantsGeneral) {
             if (lastContext === "gate") {
                 if (isShortFollowUp) {
                     if (allGatesCrowded) {
                         return `Right now it's still crowded. I suggest waiting a few minutes. ${fastestClearingGate.name} should clear soon.`;
                     }
                     return `Right now, ${bestGate.name} is still your best option for a quick entry!`;
                 }
                 wantsGate = true;
             } else if (lastContext === "food") {
                 if (isShortFollowUp) {
                     return `The wait at ${bestFood.name} is still holding at around ${bestFood.waitTime} minutes.`;
                 }
                 wantsFood = true;
             } else if (isShortFollowUp) {
                 wantsGeneral = true;
             }
        }

        if ((wantsGate && wantsFood) || wantsGeneral) {
            lastContext = "general";
            if (allGatesCrowded) {
                return `All gates are currently crowded. I recommend waiting for a few minutes. ${fastestClearingGate.name} is expected to clear in about ${fastestClearingGate.clearingTime} minutes. For food, ${bestFood.name} has the shortest wait time.`;
            }
            return `For entry, ${bestGate.name} is best. For food, ${bestFood.name} has the shortest wait time.`;
        } else if (wantsGate) {
            lastContext = "gate";
            if (allGatesCrowded) {
                return `All gates are currently crowded. I recommend waiting for a few minutes. ${fastestClearingGate.name} is expected to clear in about ${fastestClearingGate.clearingTime} minutes.`;
            }
            const responses = [
                `Right now, ${bestGate.name} seems like the best option.`,
                `You can consider ${bestGate.name} as it has lower crowd.`,
                `${bestGate.name} is currently less crowded.`,
                `I'd suggest heading to ${bestGate.name} for the quickest entry!`
            ];
            return getRandomResponse(responses);
        } else if (wantsFood) {
            lastContext = "food";
            const responses = [
                `For the shortest waiting time, I recommend ${bestFood.name}. The current wait is only ${bestFood.waitTime} minutes.`,
                `You should grab a bite at ${bestFood.name}! The line is only about ${bestFood.waitTime} minutes long.`,
                `Right now, ${bestFood.name} is your best bet with a quick ${bestFood.waitTime} min wait.`
            ];
            return getRandomResponse(responses);
        } else if (lowerMsg.includes('washroom') || lowerMsg.includes('restroom') || lowerMsg.includes('toilet')) {
            return "The nearest restrooms are located near Section 104. Just head down the hall to your right!";
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            return "Hello there! How can I assist you today? You can ask me about gate crowds, food wait times, or general directions.";
        } else {
            return "I'm not quite sure I caught that. I can help with crowd info, gate entry, or food stall wait times inside the venue!";
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
