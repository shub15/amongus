# LAN Setup Guide for Among Us Coding Game

This guide explains how to set up and run the game so that multiple players can join from different devices on the same local network.

## Prerequisites

1. One device will act as the server (where both backend and frontend will run)
2. All other devices will be clients (players)
3. All devices must be on the same local network (WiFi/LAN)

## Server Setup

### 1. Find Your Server IP Address

First, you need to find the IP address of the server device:

**Windows:**

```cmd
ipconfig
```

Look for "IPv4 Address" under your active network connection (usually starts with 192.168.x.x or 10.x.x.x)

**macOS/Linux:**

```bash
ifconfig
```

or

```bash
ip addr show
```

### 2. Update Environment Variables

Create or update the `.env` file in the root directory of the project:

```env
# Backend configuration
HOST=0.0.0.0
PORT=3000
```

### 3. Start the Backend Server

Navigate to the project root directory and run:

```bash
npm run dev:lan
```

The server will output the LAN IP address you can use:

```
Server is running on http://0.0.0.0:3000
LAN Access: http://192.168.1.100:3000
```

### 4. Start the Frontend Server

In a separate terminal, navigate to the frontend directory and run:

```bash
npm run dev:lan
```

The frontend will be accessible on the same IP address:

```
Local: http://localhost:3001
Network: http://192.168.1.100:3001
```

## Client Setup

For each client device (other players):

1. Open a web browser
2. Navigate to `http://YOUR_SERVER_IP:3001` (replace with the server's actual IP)
3. The game interface will load and you can join/create games

## Quick Start Scripts

### Windows:

Double-click on `start-lan.bat` to automatically start both servers.

### macOS/Linux:

Run `./start-lan.sh` to automatically start both servers.

## Troubleshooting

### Common Issues:

1. **Firewall blocking connections:**

   - Windows: Allow Node.js through Windows Firewall
   - macOS/Linux: Check firewall settings

2. **Port conflicts:**

   - Make sure ports 3000 (backend) and 3001 (frontend) are not in use
   - You can change ports in the `.env` file

3. **CORS errors:**

   - The application should automatically handle CORS for LAN access
   - If issues persist, check the server logs

4. **Can't find server:**
   - Ensure all devices are on the same network
   - Double-check the IP address
   - Try using the numeric IP instead of hostname

### Testing the Connection:

1. From a client device, try accessing:
   - `http://YOUR_SERVER_IP:3000/health` (should return {"status": "OK"})
   - `http://YOUR_SERVER_IP:3001` (should load the game interface)

## Game Play Instructions

1. One player creates a game on the server
2. Other players join using the same game ID
3. All players can now interact in real-time

## Security Note

This setup is intended for local network use only. Do not expose these servers to the public internet without proper security measures.
