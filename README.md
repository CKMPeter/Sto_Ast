# Storage And Assistant
## Node.js, React, Express, Firebase, AI Chatbot

Author: Cao Khải Minh </br>
This guide walks you through the steps to create a simple Google clone application using **Node.js**, **React**, **Firebase** (for authentication and storage), and an **AI-powered chatbot** with a text summarizer. 

### Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (Latest LTS version)
- **npm** (Package manager)
- **Firebase account** (for authentication and file storage)
- **Code editor** like VSCode
- **React** (for front-end development)
- **@google/generative-AI** (for AI related content)
- **bootstrap** (For icon and front end related matter)
- **mkcert** (For https services)
- **choco**
- **dotenv**
- **cors**

### Step 1: Setting up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In your Firebase project:
   - Enable **Firebase Authentication** and set up your preferred sign-in method (e.g., Email/Password).
   - Enable **Firebase Readtime Database** for file uploads.
3. Install Firebase SDK in your project:
```bash
   npm install firebase
```
4. Initialize Firebase in your Node.js backend and React app by creating a `firebase.js` file.


### Step 2: Gitclone the repository:
- The usual code is fine.

### Step 3: Get your Gemini API Key and Create .env file:
### How to Get Gemini API Key

Gemini is a cryptocurrency exchange platform that allows you to interact with their platform programmatically using API keys. Follow the steps below to obtain your Gemini API key.

#### Prerequisites
- A Gemini account (If you don’t have one, you can create it at [Gemini](https://www.gemini.com/)).

#### Steps to Get Gemini API Key:

1. **Log in to Your Gemini Account:**
   - Visit [Gemini](https://www.gemini.com/) and log in with your credentials.

2. **Navigate to the API Settings:**
   - Once logged in, click on your **Account** icon in the top right corner.
   - Select **API** from the dropdown menu.

3. **Create a New API Key:**
   - On the API page, click the **Create New API Key** button.
   - You will be asked to provide a **label** for your API key (e.g., "MyApp API Key").

4. **Set Permissions:**
   - You will need to specify what permissions you want to grant to the API key:
     - **Read-only**: Only allows you to retrieve data like market prices or account info.
     - **Trading**: Allows you to make trades.
     - **Withdrawals**: Allows you to withdraw funds.
   - Choose the permissions that suit your needs.

5. **Generate the API Key:**
   - After configuring the permissions, click **Generate API Key**.
   - Gemini will generate an API key (the **API Key** and **API Secret**). Copy them and save them securely as you will not be able to retrieve the secret key again.

6. **Create an .env file in both the my-react-app and server folder:**
In my-react-app/.env:
```bash
https = true
SSL_CRT_FILE = cert.pem
SSL_KEY_FILE = key.pem
REACT_APP_FIREBASE_API_KEY = [your-api-key]
REACT_APP_FIREBASE_AUTH_DOMAIN = [your-api-key]
REACT_APP_FIREBASE_PROJECT_ID = [your-api-key]
REACT_APP_FIREBASE_STORAGE_BUCKET = [your-api-key]
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = [your-api-key]
REACT_APP_FIREBASE_APP_ID = [your-api-key]
REACT_APP_FIREBASE_DATABASE_URL = [your-api-key]
```
In server/.env:
```bash
https = true
SSL_CRT_FILE = cert.pem
SSL_KEY_FILE = key.pem
REACT_APP_GEMINI_API_KEY = [your-api-key]
```
### Step 4: Set up the enviroment:
Navigate into the my-react-app & server to install:
```bash
npm install
```
### Step 5: Set up mkcert for https:
1. Install mkcert:
```bash
choco install mkcert
mkcert -install
```
2.  Create a key and cretificate (in my-react-app):
```bash
mkcert -cert-file cert.pem -key-file key.pem localhost
```
### Step 6: Run the web:
int both server and my-react-app folder:
```bash
npm run start
```


