import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Correct import
 // Make sure to use a .env file
console.log('API Key:', process.env.REACT_APP_GEMINI_API_KEY);

const client = new GoogleGenerativeAI(
    process.env.REACT_APP_GEMINI_API_KEY
);

async function run (input){
    const model = client.getGenerativeModel({
        model: 'gemini-1.5-flash',
    });

    const prompt = `${input}`

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    return text
}

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Use the environment variable for the API key
   
    // Initialize GoogleGenerativeAI client
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (input.trim()) {
            setMessages([...messages, { text: input, sender: 'user' }]);
            setLoading(true);
    
            try {
                // Wait for the AI response from the run function
                const aiResponse = await run(input);
    
                // Use the response from the AI model or fallback to a default message
                const responseText = aiResponse || "Sorry, I couldn't get a response.";
    
                // Update messages with the AI response
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: responseText, sender: 'bot' },
                ]);
            } catch (error) {
                console.error("Error interacting with Generative AI API:", error);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { text: "Sorry, I couldn't get a response at the moment.", sender: 'bot' },
                ]);
            } finally {
                setLoading(false);  // Reset loading state
            }
        }
        setInput(''); // Clear input field after submission
    };
    
    return (
        <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {messages.map((message, index) => (
                    <div key={index} style={{ textAlign: message.sender === 'user' ? 'right' : 'left' }}>
                        <p style={{ backgroundColor: message.sender === 'user' ? '#d1e7ff' : '#f0f0f0', padding: '8px', borderRadius: '8px' }}>
                            {message.text}
                        </p>
                    </div>
                ))}
                {loading && (
                    <div style={{ textAlign: 'left', marginTop: '10px' }}>
                        <p style={{ backgroundColor: '#f0f0f0', padding: '8px', borderRadius: '8px' }}>
                            Thinking...
                        </p>
                    </div>
                )}
            </div>

            {/* Form to handle user input */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
                <button type="submit" style={{ marginLeft: '8px', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px' }}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chatbot;
