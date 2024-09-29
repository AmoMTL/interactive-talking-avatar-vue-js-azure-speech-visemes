<template>
    <div class="chatbot-container">
        <div class="chatbox">
            <div class="messages" ref="messagesContainer">
                <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender]">
                    <p>{{ msg.text }}</p>
                    <span class="timestamp">{{ msg.time }}</span>
                </div>
            </div>
            <form @submit.prevent="sendMessage" class="input-form">
                <input type="text" v-model="userInput" placeholder="Type your message..." required
                    :disabled="isLoading" />
                <button type="submit" :disabled="isLoading">Send</button>
            </form>
            <div v-if="isLoading" class="loading-spinner">
                <span>Loading...</span>
            </div>
            <div v-if="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>
        </div>
        <div class="placeholder-image">
            <img src="@/assets/real_man.jpeg" alt="Placeholder Image" loading="lazy" />
            <!-- <img src="@/assets/1.svg" alt="Placeholder Image" class="viseme-image" /> -->
            <img v-if="currentVisemeImage" :src="currentVisemeImage" alt="Viseme Image" class="viseme-image" />
            <img v-else src="@/assets/19.svg" alt="Default Viseme Image" class="viseme-image" />
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'Chatbot',
    data() {
        return {
            userInput: '',
            messages: [],
            isLoading: false,
            errorMessage: '',
            audioCache: {},
            visemes: [], // Store viseme data
            currentVisemeImage: '', // Current viseme image path
            visemeTimeouts: [], // Timeouts for viseme synchronization
        };
    },
    methods: {
        async sendMessage() {
            if (!this.userInput.trim()) return;

            // Add user message
            const userMessage = {
                text: this.userInput,
                sender: 'user',
                time: new Date().toLocaleTimeString(),
            };
            this.messages.push(userMessage);

            // Scroll to latest message
            this.$nextTick(() => {
                const container = this.$refs.messagesContainer;
                container.scrollTop = container.scrollHeight;
            });

            // Clear input
            const messageToSend = this.userInput;
            this.userInput = '';
            this.isLoading = true;
            this.errorMessage = '';

            try {
                // Send message to backend
                const response = await axios.post('http://localhost:4000/api/chat', {
                    message: messageToSend,
                });

                const aiResponse = response.data.response;
                const audioFilename = response.data.audio;
                const visemes = response.data.visemes; // Capture viseme data

                // Store viseme data
                this.visemes = visemes;
                this.currentVisemeImage = '';
                this.visemeTimeouts.forEach(timeout => clearTimeout(timeout));
                this.visemeTimeouts = [];

                // Add AI message
                const aiMessage = {
                    text: aiResponse,
                    sender: 'ai',
                    time: new Date().toLocaleTimeString(),
                };
                this.messages.push(aiMessage);

                // Scroll to latest message
                this.$nextTick(() => {
                    const container = this.$refs.messagesContainer;
                    container.scrollTop = container.scrollHeight;
                });

                // Fetch and play audio with viseme synchronization
                this.playAudio(audioFilename);
            } catch (error) {
                console.error('Error sending message:', error);
                const errorMsg = 'Sorry, something went wrong. Please try again.';
                const errorMessage = {
                    text: errorMsg,
                    sender: 'ai',
                    time: new Date().toLocaleTimeString(),
                };
                this.messages.push(errorMessage);
                this.errorMessage = errorMsg;
            } finally {
                this.isLoading = false;
            }
        },
        async playAudio(filename) {
            if (this.audioCache[filename]) {
                this.audioCache[filename].play().catch(error => {
                    console.error('Error playing cached audio:', error);
                });
                return;
            }

            try {
                const audioResponse = await axios.get(`http://localhost:4000/api/audio/${filename}`, {
                    responseType: 'blob',
                });

                // Determine MIME type based on file extension
                const extension = filename.split('.').pop().toLowerCase();
                let mimeType = '';
                switch (extension) {
                    case 'mp3':
                        mimeType = 'audio/mpeg';
                        break;
                    case 'wav':
                        mimeType = 'audio/wav';
                        break;
                    case 'ogg':
                        mimeType = 'audio/ogg';
                        break;
                    default:
                        console.warn(`Unsupported audio format: .${extension}. Defaulting to 'audio/mpeg'.`);
                        mimeType = 'audio/mpeg';
                }

                const audioURL = window.URL.createObjectURL(new Blob([audioResponse.data], { type: mimeType }));
                const audio = new Audio(audioURL);
                this.audioCache[filename] = audio;

                // Start viseme animation when audio plays
                audio.addEventListener('play', () => {
                    this.startVisemeAnimation(audio);
                });

                // Clear viseme image when audio ends
                audio.addEventListener('ended', () => {
                    this.currentVisemeImage = '';
                    this.visemeTimeouts.forEach(timeout => clearTimeout(timeout));
                    this.visemeTimeouts = [];
                });

                // Handle playback errors
                audio.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
            } catch (error) {
                console.error('Error fetching or playing audio:', error);
            }
        },
        startVisemeAnimation(audio) {
            // Clear any existing timeouts
            this.visemeTimeouts.forEach(timeout => clearTimeout(timeout));
            this.visemeTimeouts = [];

            const audioStartTime = audio.currentTime * 1000; // Convert to milliseconds
            const startTime = performance.now(); // High-resolution timestamp

            // Schedule viseme image updates
            this.visemes.forEach(viseme => {
                const delay = viseme.offset - audioStartTime;

                if (delay >= 0) {
                    const timeout = setTimeout(() => {
                        this.currentVisemeImage = `/src/assets/${viseme.id}.svg`;
                    }, delay);
                    this.visemeTimeouts.push(timeout);
                }
            });
        },
    },
    beforeDestroy() {
        // Clear any viseme timeouts
        this.visemeTimeouts.forEach(timeout => clearTimeout(timeout));
        this.visemeTimeouts = [];
    },
};
</script>

<style scoped>
.chatbot-container {
    display: flex;
    justify-content: space-between;
    padding: 0;
}

.chatbox {
    flex: 1;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    border: 1px solid #6a6a6a;
    border-radius: 8px;
    padding: 25px;
    background-color: inherit;
    height: 600px;
    margin-left: 50px;
}

.messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
}

.message {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border-radius: 8px;
    max-width: 80%;
    position: relative;
}

.message.user {
    background-color: #d1e7dd;
    align-self: flex-end;
}

.message.ai {
    background-color: #f8d7da;
    align-self: flex-start;
}

.timestamp {
    display: block;
    font-size: 0.8rem;
    color: #666;
    margin-top: 0.2rem;
}

.input-form {
    display: flex;
}

.input-form input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.input-form button {
    padding: 0.5rem 1rem;
    margin-left: 0.5rem;
    border: none;
    background-color: #0d6efd;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.input-form button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
}

.input-form button:hover:not(:disabled) {
    background-color: #0b5ed7;
}

.loading-spinner {
    text-align: center;
    margin-top: 0.5rem;
    color: #555;
}

.error-message {
    color: red;
    text-align: center;
    margin-top: 0.5rem;
}

.placeholder-image {
    position: relative;
    width: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 50px;
}

.placeholder-image img {
    max-width: 100%;
    border-radius: 8px;
}

.placeholder-image .viseme-image {
    position: absolute;
    top: 297px;
    left: 258px;
    width: 75px;
}
</style>