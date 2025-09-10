const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active connections by group
const groupConnections = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const groupId = url.pathname.split('/').pop(); // Extract group ID from URL
  const token = url.searchParams.get('token'); // Get token from query params

  // TODO: Validate JWT token here
  // const user = validateToken(token);
  // if (!user) {
  //   ws.close(4001, 'Unauthorized');
  //   return;
  // }

  if (!groupConnections.has(groupId)) {
    groupConnections.set(groupId, new Set());
  }

  groupConnections.get(groupId).add(ws);

  console.log(`User connected to group: ${groupId}`);

  ws.on('message', (data) => {
    try {
      const messageData = JSON.parse(data);

      // Broadcast message to all users in the group
      const groupUsers = groupConnections.get(groupId);
      if (groupUsers) {
        groupUsers.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'message',
              groupId: groupId,
              messageId: messageData.timestamp,
              content: messageData.content,
              sender: messageData.sender,
              timestamp: messageData.timestamp
            }));
          }
        });
      }

      // TODO: Save message to database
      // saveMessageToDatabase(messageData);

    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    const groupUsers = groupConnections.get(groupId);
    if (groupUsers) {
      groupUsers.delete(ws);
      if (groupUsers.size === 0) {
        groupConnections.delete(groupId);
      }
    }
    console.log(`User disconnected from group: ${groupId}`);
  });
});

server.listen(3001, () => {
  console.log('Chat server running on port 3001');
});