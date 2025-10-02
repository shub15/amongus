// Simple API test script
const testAPI = async () => {
  const baseURL = "http://localhost:3000/api";

  try {
    console.log("Testing API endpoints...");

    // Test health endpoint
    const healthResponse = await fetch(`${baseURL}/health`);
    const healthData = await healthResponse.json();
    console.log("Health check:", healthData);

    // Test player registration
    const playerResponse = await fetch(`${baseURL}/players/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Player",
      }),
    });

    const playerData = await playerResponse.json();
    console.log("Player registration:", playerData);

    // Test game creation
    const gameResponse = await fetch(`${baseURL}/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imposterCount: 1,
      }),
    });

    const gameData = await gameResponse.json();
    console.log("Game creation:", gameData);

    console.log("API tests completed successfully!");
  } catch (error) {
    console.error("API test failed:", error);
  }
};

testAPI();
