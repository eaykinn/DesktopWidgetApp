const media = require('windows-media-sessions');
async function test() {
  const manager = media.createSessionManager();
  console.log("Manager methods:", Object.keys(manager));
  const sessions = await manager.getActiveSessions();
  console.log("Sessions:", JSON.stringify(sessions, null, 2));
}
test();
