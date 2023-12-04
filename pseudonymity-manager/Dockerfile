# Use Alpine as base image
FROM alpine:latest

# Install Node.js and npm
RUN apk add --update nodejs npm

# Install Python
RUN apk add --update python3 py3-pip

# Install OpenVPN
RUN apk add --update openvpn

# Install Yarn
RUN apk add --update yarn

# Check versions
RUN node -v && npm -v && python3 --version && pip3 --version && openvpn --version && yarn --version

COPY Server Server 
Copy WebClients WebClients

RUN npm install express
RUN node Server/index.js
