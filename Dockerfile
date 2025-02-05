# Use an official Node.js runtime as a parent image (Node.js 18)
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to install dependencies before copying the rest of the app
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

EXPOSE 5002

# Run the app when the container starts
CMD ["npm", "start"]
