# Backend Project

A scalable backend project built using Node.js, Express.js, Supabase (PostgreSQL), JWT Authentication, Cloudinary, and Multer.

This project includes:

* User Authentication
* Video Upload System
* Subscription System
* Likes System
* Tweets
* Comments
* Playlist Management
* Watch History
* JWT Authentication
* Cloudinary Media Upload
* PostgreSQL Database using Supabase

---

# Data Model

View Database Schema / ER Diagram:

[Supabase Database Model](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

# Tech Stack

## Backend

* Node.js
* Express.js

## Database

* Supabase
* PostgreSQL

## Authentication

* JWT (Access Token + Refresh Token)
* bcrypt

## File Uploads

* Multer
* Cloudinary

---

# Features

## User Features

* Register User
* Login User
* Logout User
* Refresh Access Token
* Change Password
* Update Avatar
* Update Cover Image
* Get Current User
* Get User Channel Profile

## Video Features

* Publish Video
* Update Video
* Delete Video
* Toggle Publish Status
* Get All Videos
* Get Video By ID
* Increase Views

## Subscription Features

* Subscribe / Unsubscribe Channel
* Get Channel Subscribers
* Get Subscribed Channels

## Like Features

* Like / Unlike Video
* Like / Unlike Comment
* Like / Unlike Tweet

## Comment Features

* Add Comment
* Update Comment
* Delete Comment
* Get Video Comments

## Playlist Features

* Create Playlist
* Update Playlist
* Delete Playlist
* Add Video To Playlist
* Remove Video From Playlist

## Tweet Features

* Create Tweet
* Update Tweet
* Delete Tweet
* Get User Tweets

---

# Installation

## Clone Repository

```bash
git clone <your_repo_url>
```

## Move Into Project

```bash
cd project-name
```

## Install Dependencies

```bash
npm install
```

## Run Development Server

```bash
npm run dev
```

---

# Authentication Flow

## Access Token

Used for protected routes.

## Refresh Token

Used to generate new access token.

Both are stored in cookies.

---

# Running Project

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

---

# Future Improvements

* Video Streaming
* Notifications
* Live Chat
* Real-time Comments
* AI Recommendations
* Admin Dashboard
* Analytics
* Video Processing Queue

---

# Author

Sumit Avhale

Full Stack Developer

---

# License

This project is licensed under the MIT License.
