Diaspora Echo
A web application dedicated to raising awareness of historical Black figures and their contributions to society. Diaspora Echo aims to educate and inform the masses about important historical figures who may have been overlooked in traditional educational contexts.
Project Overview
Diaspora Echo is built using:

Frontend: React.js with Styled Components
Backend: Node.js with Express
Database: MongoDB (via Mongoose)

Project Structure
Copydiasporaecho/
├── client/            # React frontend
├── server/            # Node.js backend
├── .gitignore         # Git ignore file
└── README.md          # This file
Getting Started
Prerequisites

Node.js (v14 or higher)
npm (v6 or higher)
MongoDB (local or Atlas)

Installation

Clone the repository
Copygit clone https://github.com/Thursaun/diasporaecho.git
cd diasporaecho

Install frontend dependencies
Copycd client
npm install

Install backend dependencies
Copycd ../server
npm install

Create a .env file in the server directory with the following variables:
CopyPORT=5000
MONGODB_URI=mongodb://localhost:27017/diasporaecho

Start the development servers

For the backend:
Copycd server
npm run dev

For the frontend:
Copycd client
npm start




Features

Explore historical Black figures through an interactive interface
Learn about their contributions, achievements, and historical context
Search and filter capabilities to find specific individuals or time periods
Educational resources and references for further learning

License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgments

Thanks to all contributors who have helped bring this project to life
Special thanks to the countless historical figures whose stories inspire this application