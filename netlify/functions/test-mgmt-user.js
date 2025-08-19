// Test script for mgmt-user function
const TEST_USER_ID = "google-oauth2|108227466304412850123";
const FUNCTION_URL = "https://deluxe-sunflower-673a2f.netlify.app/.netlify/functions/mgmt-user";

async function testMgmtUser() {
  try {
    const response = await fetch(`${FUNCTION_URL}?user_id=${encodeURIComponent(TEST_USER_ID)}`);
    const data = await response.json();
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    // Basic assertions
    if (response.status === 200) {
      console.log("✅ Function returned 200");
      
      if (data.sub === TEST_USER_ID) {
        console.log("✅ Correct user returned");
      } else {
        console.log("❌ Wrong user returned");
      }
      
      if (data.email === "livio@acerbo.me") {
        console.log("✅ Email matches expected value");
      } else {
        console.log("❌ Email doesn't match");
      }
      
      if (data.name && data.given_name && data.family_name) {
        console.log("✅ Required user fields present");
      } else {
        console.log("❌ Missing required user fields");
      }
    } else {
      console.log("❌ Function failed with status:", response.status);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testMgmtUser();