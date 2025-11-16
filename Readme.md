# Hush

This is a simple chat app that lets you create anonymous, private chat rooms. You can create a new room, share the link, and anyone can join with just a username. The app features group text chat and group voice chat.

A key feature of this project is privacy: **messages are not saved in any database**. The server just relays messages and voice. When the last person leaves, the chat is gone forever.


## Features

* **Create Rooms:** Instantly create a new, private chat room.
* **Join Rooms:** Join any room if you have the shareable room code.
* **Usernames:** Set a custom username before you join a room.
* **Group Text Chat:** Real-time, in-browser group chat.
* **Live User Count:** See how many people are currently in the room with you.
* **Group Voice Chat:** Join a live voice call with everyone in the room using WebRTC.

## Tech Stack

This project is built in two parts:

### Frontend (Client-side)

* **React** (using Vite)
* **TypeScript**
* **Tailwind CSS** for styling
* **Socket.IO Client** to handle the real-time connection
* **React Router** for pages

### Backend (Server-side)

* **Node.js**
* **Express** for the API
* **TypeScript**
* **Socket.IO** for real-time communication
* **MongoDB** (only used to generate and store the initial room IDs)


## What I Learned 

* **Custom WebRTC Hook:** All the complex logic for group voice chat is built into a single, custom React hook (`useWebRTC`). This keeps the main `RoomPage` component clean and easy to read. The hook manages all the `RTCPeerConnection` objects, state for audio streams, and all the signaling logic (offers, answers, etc.).
* **Mesh Network:** The group voice chat is a "mesh," meaning every user creates a direct peer-to-peer connection with every other user in the room. The server is only used for "signaling" (to help them find each other).
