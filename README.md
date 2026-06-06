# Storage And Assistant
## Node.js, React, Express, Firebase, AI Chatbot

Author: Cao Khải Minh </br>
This guide walks you through the steps to create a Multi Purpose application using **Node.js**, **React**, **Firebase** (for authentication and storage), and an **AI-powered chatbot**.
Teammate: [Đào Trung Kiên](https://github.com/DoomDayKross)

### Features:
- Provide a easy to use interface.
- Help rename the file base on content.
- Help to analysize the text/image files.
- Smart search for File base on AI.
- A Chat And Call system for individual or groups communication.
- A Scheduling system for handle your upcoming event and notify user.
- A Task Monitor System for Personal usage or Group project.

### Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (Latest LTS version)
- **npm** (Package manager)
- **Firebase account** (for authentication and file storage)
- **Gemini acccount**
- **OpenAI account**
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
   - Enable **Firebase Readtime Database** for user and chat/call function to work.
   - Enable **Firebase Firestore** for file storage, task and schedule to work.
4. Select your project.
5. Click Project Settings.
6. Open the Service Accounts tab.
7. Click Generate New Private Key.


### Step 2: Gitclone the repository:
- The usual code is fine.

### Step 3: Get your Gemini and OpenAI API Key and Create .env file:
### How to Get Gemini API Key

Gemini and OpenAI is a AI platform that allows you to interact with their platform programmatically using API keys. Follow the steps below to obtain your Gemini API key.

#### Prerequisites
- A Gemini account (If you don’t have one, you can create it at [Gemini](https://www.gemini.com/)).
- A OpenAI account (If you don’t have one, you can create it at [OpenAI](https://platform.openai.com)) (pay option, but there is a way to use it for free check the OpenAI's Disclaimer).

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
  
#### Steps to Get Gemini API Key:
1. **Log in to Your OpenAI Account:**
   - Visit [OpenAI](https://platform.openai.com) and log in with your credentials.
  
2. **Navigate to create a new project if not prompted:**
   - In the bottom left of the screen click on your avata, then select **Profile Settings**.
3. **Navigate to Project:**
   - On the side menu click **Project** </br>
   - Or you can use [this link](https://platform.openai.com/settings/organization/projects).
   - Then click **Create** a project name **Sto_Ast**
   
4. **Create API key:**
   - Click **Back To Project** click on **API Keys** on the side bar, then click **Create New Secret Key**.
   - Keep on **You** tab and enter the name of your key and select the the Project you just created, then click create.
   - After that you should have the Key.
   

5. **Add Credit To Your Key:**
   - For this approach to work you needs to add credit to your API Key.
   - Use [this link](https://platform.openai.com/settings/organization/billing/overview) to go to the billing page.
  
##### Disclaimer #####
- There is an alternative free approach but i do not reccomend it, it will expired in one month after created.
- This is the Flow of what you need to do
```
github -> Settings -> developer setting -> Personal Access Token -> Fine-grained Token -> Generate-> Copy the Token
```
#### Create an .env file in both the my-react-app and server folder:
In my-react-app/.env:
```bash
https = true
SSL_CRT_FILE = cert.pem
SSL_KEY_FILE = key.pem

VITE_APP_BACKEND_URL=https://localhost:5000
VITE_APP_FRONTEND_URL=https://localhost:3000

VITE_APP_FIREBASE_API_KEY=[your-api-key]
VITE_APP_FIREBASE_AUTH_DOMAIN=[your-auth-domain]
VITE_APP_FIREBASE_PROJECT_ID=[your-project-id]
VITE_APP_FIREBASE_STORAGE_BUCKET=[your-storage-bucket]
VITE_APP_FIREBASE_MESSAGING_SENDER_ID=[your-sender-id]
VITE_APP_FIREBASE_APP_ID=[your-app-id]
VITE_APP_FIREBASE_DATABASE_URL=[your-database-url]
```
In server/.env (use the file from step 1 to fill in this .env):
```bash
HTTPS=true
SSL_CRT_FILE=cert.pem
SSL_KEY_FILE=key.pem

REACT_APP_GEMINI_API_KEY=[your-gemini-api-key]

FRONTEND_URL=https://localhost:3000
BACKEND_URL=https://localhost:5000

PROJECT_ID=[your-project-id]
PRIVATE_KEY_ID=[your-private-key-id]
PRIVATE_KEY=[your-private-key]
CLIENT_EMAIL=[your-client-email]
CLIENT_ID=[your-client-id]
AUTH_URI=[your-auth-uri]
TOKEN_URI=[your-token-uri]
AUTH_PROVIDER_X509_CERT_URL=[your-auth-provider-cert-url]
CLIENT_X509_CERT_URL=[your-client-cert-url]
UNIVERSE_DOMAIN=[your-universe-domain]

FIREBASE_DATABASE_URL=[your-database-url]
FIREBASE_STORAGE_BUCKET=[your-storage-bucket]
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
in frontend run:
```bash
npm run dev
```

in backend run:
```bash
npm run start
```

