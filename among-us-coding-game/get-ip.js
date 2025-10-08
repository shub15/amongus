const os = require("os");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = null;

  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((interfaceData) => {
      // Skip internal (loopback) and IPv6 addresses
      if (interfaceData.family === "IPv4" && !interfaceData.internal) {
        localIP = interfaceData.address;
      }
    });
  });

  return localIP;
}

const ip = getLocalIP();
if (ip) {
  console.log(`Your local IP address is: ${ip}`);
  console.log(
    `Use this address to access the game from other devices on the same network:`
  );
  console.log(`  Backend: http://${ip}:3000`);
  console.log(`  Frontend: http://${ip}:3001`);
} else {
  console.log(
    "Could not determine local IP address. Please check your network connection."
  );
  console.log(
    'You can try running "ipconfig" (Windows) or "ifconfig" (macOS/Linux) to find your IP.'
  );
}
