Commands:
Start a server :
http-server -p 6060

Open http://127.0.0.1:6060/

Steps to change Speech Url:
1.Make changes in Host() and InteractiveRelativeUri() methods in SpeechConnectionFactory.ts
2.npm run bundle (Creating new distribution)
3.Run the app using command: 
  http-server -p 6060
4.Keys speech api
Custom Speech API Key - 25061b8c43ac4cb5a13512edf7cfdac3
Standard Speech API Key - 29da9169abd84446b489d659edb35169
