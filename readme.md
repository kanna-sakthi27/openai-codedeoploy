# AI Code Editor
A Node.js web app that uses the OpenAI API to review and automatically refactor code in a project folder, with real-time progress, batch processing, and a safe review/approve workflow.

## Features

1. Node.js backend (Express)
2. Frontend with real-time progress (SSE)
3. Batch processing: Processes 3 files at a time, auto-advances until all files are checked
4. OpenAI API (not Azure) for code review and suggestions
5. Safe review workflow: Changes are staged for review before applying
6. No server restarts when pending_changes folder updates (thanks to nodemon.json)



## Prerequisites
* Node.js (v18+ recommended)
* An OpenAI API key

## Setup

1. Clone Repo

```sh 
git clone https://github.com/kanna-sakthi27/openai-codedeoploy.git 
cd openai-codedeoploy
```

2. Install dependencies

```sh 
npm install
```

3. Setup env file

Create a .env file in the root directory:

OPENAI_API_KEY=sk-...your-openai-key...```
OPENAI_MODEL=gpt-4o```
CODE_BASE_PATH=./webapp```      # or your code folder

## Running the App

Start the backend (with auto-restart on code changes, except for pending_changes):

```sh
npm start

```
This runs: nodemon src/index.js

The server will be available at http://localhost:3000


### How It Works

1. Describe a change in the web UI and click "Generate & Apply Code".

2. The backend processes all files in batches of 3, using OpenAI to suggest changes.

3. Progress is shown in real time.

4. Changes are staged in a pending_changes folder for review.

5. Go to "Review Pending Changes" to see and approve changes.

6. When approved, changes are backed up and applied to your codebase.

#### Preventing Unwanted Restarts

The included nodemon.json ensures that changes in pending_changes do not restart your server:

json
{
  "ignore": ["**/pending_changes/**"]
}

## Security & Privacy
* Never commit your .env file or OpenAI API key to public repositories.

* The app only scans files with extensions: .js, .cs, .xaml, .css (customize in index.js if needed).

### Customization
* Change supported file extensions in src/index.js (fileExts array).

* Addjust batch size by editing batchSize in src/index.js.

* Update the system prompt in src/openaiClientOpenAI.js for different code review instructions.

### Troubleshooting
If you see "Error during processing!", check your backend logs for errors or memory issues.

If your codebase is large, reduce the batch size to avoid timeouts or memory exhaustion.

If you get OpenAI API errors, check your API key and usage limits.

### License
MIT (or your chosen license)

### Credits
Built with Express, OpenAI API, and nodemon.

Happy coding!

Let me know if you want this tailored for your repo name, or want a sample screenshot section!

