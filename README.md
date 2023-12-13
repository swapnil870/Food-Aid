# Food Donation System

Welcome to the Food Donation System, a web application designed to streamline the process of food donation and collection activities.

## Table of Contents
* [Features](#features)
* [Technologies Used](#technologies-used)
* [npm Packages Used](#npm-packages-used)
* [Prerequisites](#prerequisites)
* [Installation and Setup](#installation-and-setup)
* [Useful Links](#useful-links)
* [Contact](#contact)

## Features
- The system caters to three types of users: admins, donors, and agents.
- **Admins:** Control all activities, accept/reject donations, and select agents.
- **Donors:** Driving users who make food donations.
- **Agents:** Responsible for collecting food from donors' homes.
- Each user requires an account for system access.
- Every user has a dashboard summarizing relevant information.
- The application provides signup, login, and logout functionalities.

### Donor Features
- Donors can request food donations with basic details.
- Track the status of donation requests (accepted or rejected).
- View current incomplete donations.
- Access a history of past donations.
- Update their profile.

### Admin Features
- Admins receive and process donation requests.
- Assign agents to collect donations from donors' homes.
- View pending donations and their status.
- Access a record of all received donations.
- View all agents in the application.
- Update their profile.

### Agent Features
- Receive notifications from admins for food collection.
- Mark collection status upon obtaining food from donors' homes.
- View a history of previously collected food donations.
- Update their profile.

## Technologies Used
- HTML
- CSS
- Bootstrap
- JavaScript
- Node.js
- Express.js
- MongoDB
- EJS

## npm Packages Used
- express
- ejs
- express-ejs-layouts
- mongoose
- express-session
- bcryptjs
- passport
- passport-local
- connect-flash
- method-override
- dotenv

## Prerequisites
To run the application:
- Node.js must be installed on your system.
- MongoDB database is required.
- Code editor (preferred: VS Code).

## Installation and Setup
1. Download the source code to your desired location.
2. Open the code in your preferred code editor.
3. Install dependencies listed in the `package.json` file using the terminal:
	```sh
	npm install
	```
4. Create a `.env` file and enter your MongoDB URI:
	```js
	MONGO_URI=your-mongo-uri
	```
5. In the terminal, run:
	```sh
	npm start
	```
6. Open your browser and navigate to http://localhost:5000.
7. Sign up and log in to use the application.

## Useful Links
- Github Repo: [Food-donation-system Repo]
- Node.js Download: [Node.js](https://nodejs.org/)
- VS Code Download: [VS Code](https://code.visualstudio.com/)
- Tutorials: [W3Schools](https://www.w3schools.com/)
- npmjs Docs: [npm Documentation](https://docs.npmjs.com/)
- Express.js Docs: [Express.js Documentation](https://expressjs.com/)
- Bootstrap Docs: [Bootstrap Documentation](https://getbootstrap.com/docs/5.1/getting-started/introduction/)
- Mongoose.js Docs: [Mongoose.js Documentation](https://mongoosejs.com/docs/index.html)
- MongoDB Atlas: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- MongoDB Docs: [MongoDB Documentation](https://docs.mongodb.com/manual/introduction/)
- Nodemailer Docs: [Nodemailer Documentation](https://nodemailer.com/)
- Github Docs: [GitHub Documentation](https://docs.github.com/en/get-started/quickstart/hello-world)
- Git Cheatsheet: [Git Cheatsheet](https://education.github.com/git-cheat-sheet-education.pdf)
- VS Code Keyboard Shortcuts: [VS Code Shortcuts](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)

## Contact
- Email: Swapnil.mishra870@gmail.com
- LinkedIn: [Swapnil Mishra](https://www.linkedin.com/in/swapnil-mishra-153a271aa/)
