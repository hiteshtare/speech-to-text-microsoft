io-dna-ai-labs-callnotes

Pre-requisites:
###########################################
1.Node installed
2.Git installed
3.Custom Bing Speech API Key

Commands to run the project locally:
--------------------------------------------------------------------
1.Clone local copy:
git clone https://github.com/hiteshtare/speech-to-text-microsoft.git
2.Install dependencies for websocket project in root directory:
npm install
3.Install dependencies for browser sub-project in samples/browser  directory:
npm install
4.Build the project:
npm run bundle
5.Install http-server module globally using npm for hosted local server:
npm install http-server -g
6.Start a server on port no 6060:
http-server -p 6060
7.Open the following link:
http://127.0.0.1:6060/
8.Navigate to the following
http://127.0.0.1:6060/samples/browser/Sample.html
9.Enter YOUR_BING_SPEECH_API_KEY subscribed
10.Click on start button to start translation.

Changes made to the original MS source code:
--------------------------------------------------------------------
1.Extra key-value added for custom speech url in SpeechConnectionFactory.ts 
  Please refer the following code : 
cid: "32b8bdd1-5ad2-4c7d-8f12-28f3890a76b3", // Added param for custom speech endpoint 
2.Host() method changed for custom speech url in SpeechConnectionFactory.ts 
  Please refer the following code : 
public host: string = "wss://westus.stt.speech.microsoft.com"; // Host for custom speech endpoint
3.Sample.html modified to have default recognitionmode as Conversation
default:
    recognitionMode = SDK.RecognitionMode.Conversation; // default mode is conservation