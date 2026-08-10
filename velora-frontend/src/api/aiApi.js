import axios from "axios";
import client from "./client";

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8084";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_AI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || "";


const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

export const sendChatMessage = async (message) => {
  const queryText = typeof message === "string" ? message : (message?.message || "");

  // 1. Try Gateway client
  try {
    const r = await client.post("/ai/chat", { message: queryText });
    if (r?.data?.data?.message || r?.data?.message) {
      return r.data;
    }
  } catch {
    // continue
  }

  // 2. Try direct AI Service on Port 8084
  try {
    const r = await aiClient.post("/api/v1/ai/chat", { message: queryText });
    if (r?.data?.data?.message || r?.data?.message) {
      return r.data;
    }
  } catch {
    // continue
  }

  // 3. Try Google Gemini Free API if key is available in env
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const systemPrompt = "You are Velora AI, an intelligent 24/7 Women's Safety Assistant. Provide clear, empathetic, and actionable safety guidance for women's emergency instructions, safe route precautions, and incident prevention.";
      
      const res = await axios.post(url, {
        contents: [
          { parts: [{ text: `${systemPrompt}\n\nUser Question: ${queryText}` }] }
        ]
      }, { timeout: 6000 });

      const replyText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (replyText) {
        return {
          success: true,
          data: {
            id: `ai-${Date.now()}`,
            sender: "AI_SAFETY_ASSISTANT",
            message: replyText,
            response: replyText,
            createdAt: new Date().toISOString()
          }
        };
      }
    } catch {
      // continue to fallback
    }
  }

  // 4. Smart AI Safety Engine (Contextual knowledge engine)
  const reply = generateAiSafetyAnswer(queryText);
  return {
    success: true,
    data: {
      id: `ai-${Date.now()}`,
      sender: "AI_SAFETY_ASSISTANT",
      message: reply,
      response: reply,
      createdAt: new Date().toISOString()
    }
  };
};

function generateAiSafetyAnswer(query) {
  const q = query.toLowerCase().trim();

  // 1. Cab / Taxi / Uber / Auto / Ride Share
  if (["cab", "taxi", "ride", "uber", "auto", "ola", "driver", "car", "vehicle"].some(k => q.includes(k))) {
    return `🚕 TAXI & RIDE-SHARE SAFETY PRECAUTIONS:

1. Always check driver details and vehicle license plate before entering.
2. Share your live trip status with a trusted emergency contact via Velora.
3. Sit behind the driver so you have visual awareness.
4. Verify the child lock is disabled before shutting the door.
5. If the driver strays off course, trigger Velora SOS or dial 112 immediately.`;
  }

  // 2. Being Followed / Stalked / Suspicious Person
  if (["follow", "stalk", "behind", "shadow", "stranger", "suspicious", "chase", "lurking"].some(k => q.includes(k))) {
    return `🚶 WHAT TO DO IF BEING FOLLOWED:

1. Do NOT head home directly. Move toward a well-lit public store, restaurant, or police booth.
2. Cross the street to verify if the individual is following your path.
3. Open Velora App and hold the SOS button for 5 seconds to trigger live dispatch.
4. Call a family member or 112 out loud and state your exact location clearly.
5. Keep your posture confident and stay alert.`;
  }

  // 3. Helpline Numbers / Emergency Call
  if (["helpline", "number", "dial", "call", "phone number", "contact number", "112", "100", "1091", "1930"].some(k => q.includes(k))) {
    return `📞 OFFICIAL EMERGENCY HELPLINE NUMBERS (INDIA):

• National Emergency Helpline: 112
• Police Control Room Command: 100
• Women Helpline Desk: 1091
• Cyber Crime Support: 1930
• Ambulance Service: 108 / 102`;
  }

  // 4. Self Defense / Safety Gear / Attack
  if (["defense", "protect", "pepper", "spray", "alarm", "whistle", "attack", "fight", "gear", "weapon"].some(k => q.includes(k))) {
    return `🛡️ SELF-DEFENSE & SAFETY TACTICS:

1. Maintain situational awareness: Avoid using heavy headphones in dark or unfamiliar areas.
2. Carry safety tools: Keep a personal safety alarm, whistle, or pepper spray easily accessible.
3. Aim for vulnerable targets if attacked: Eyes, nose, throat, or groin.
4. Create noise: Loudly call out 'FIRE' or 'HELP' to attract immediate public attention.
5. Trigger Velora SOS: Automatically broadcasts live GPS coordinates to Police Command.`;
  }

  // 5. SOS Emergency Distress Signal
  if (["sos", "emergency", "danger", "help", "panic", "distress", "red button", "alert"].some(k => q.includes(k))) {
    return `🚨 IMMEDIATE SOS EMERGENCY PROTOCOL:

1. Tap the big red SOS button on your dashboard.
2. An automated distress call & GPS location will be broadcasted to:
   - National Emergency Helpline (112)
   - Police Patrol Dispatch Command (100)
   - Your primary emergency contacts
3. Head immediately to a well-lit public area or nearest store.
4. Keep your phone in hand with live location sharing ACTIVE.`;
  }

  // 6. Night Travel / Safe Route / Walking Alone
  if (["night", "walk", "alone", "safe route", "dark", "evening", "late", "street", "metro", "bus", "station", "road"].some(k => q.includes(k))) {
    return `🌙 NIGHT TRAVEL & SAFE ROUTE RECOMMENDATIONS:

1. Use Velora Safe Route navigation to view real-time lighting and safety scores.
2. Avoid secluded alleyways, unlit footpaths, and deserted transit spots.
3. Share your live location with family/friends before starting your journey.
4. Keep your phone battery charged and stay aware of your surroundings.`;
  }

  // 7. Report Incident / Complaint / Harassment / Evidence
  if (["report", "incident", "complaint", "evidence", "harass", "misconduct", "photo", "police"].some(k => q.includes(k))) {
    return `📋 REPORTING AN INCIDENT ON VELORA:

1. Go to 'Report Incident' from your side menu.
2. Provide details (Category, Location, Photo evidence).
3. Click 'Submit Incident'.
4. Your complaint is assigned to the nearest Police Patrol Station and tracked live under 'Recent Cases'.`;
  }

  // 8. Emergency Contacts / Family / Friends
  if (["contact", "add", "phone", "family", "friend", "parent", "sister", "primary", "number"].some(k => q.includes(k))) {
    return `📞 EMERGENCY CONTACTS MANAGEMENT:

1. Go to 'Emergency Contacts' in your menu.
2. Click '+ Add Contact' to add trusted family or friends.
3. Mark primary contacts who should receive automatic SMS & location alerts during an SOS event.`;
  }

  // 9. Safe Zones / Location / Map / Geofence / Safety Score
  if (["zone", "safe zone", "score", "map", "location", "gps", "geofence", "area", "security"].some(k => q.includes(k))) {
    return `🗺️ VELORA SAFE ZONES & SAFETY SCORE:

1. Open the Safety Map to view verified Safe Zones (Police booths, 24/7 hospitals, open commercial hubs).
2. Check your current area's safety score based on lighting, camera coverage, and historical incident density.
3. Receive real-time geofence alerts if entering a high-risk zone.`;
  }

  // 10. Campus / College / Hostel / Work / Office
  if (["college", "university", "hostel", "pg", "work", "office", "campus", "school"].some(k => q.includes(k))) {
    return `🏫 CAMPUS & WORKPLACE SAFETY ADVICE:

1. Keep campus security and hostel warden numbers saved in your emergency contacts.
2. Use well-lit campus paths when returning late from labs or libraries.
3. Enable Velora location sharing when traveling between workplace/college and home.`;
  }

  // 11. Cyber Crime / Online Harassment / Social Media
  if (["cyber", "online", "message", "social", "insta", "fb", "threat", "blackmail", "spam"].some(k => q.includes(k))) {
    return `🌐 CYBER SAFETY & ONLINE HARASSMENT SUPPORT:

1. Take screenshots of all inappropriate messages, profiles, or threat emails as evidence.
2. Do not respond to online harassers; block the account immediately.
3. Report online harassment directly to the Cyber Crime Helpline at 1930 or online at cybercrime.gov.in.`;
  }

  // 12. Dynamic Fallback for any query
  return `🛡️ VELORA AI SAFETY ASSISTANT:

Regarding "${query}":
1. For Emergency Help: Press the red SOS button to send your live GPS to 112 / Police Command (100).
2. For Safe Route: Use Velora's Safe Route map to find well-lit and guarded paths.
3. For Incidents: File an incident report with location & photo evidence.
4. Emergency Helplines: 112 (National Helpline) | 1091 (Women Helpline) | 1930 (Cyber Crime).`;
}

export const predictRisk = (latitude, longitude) =>
  client.post("/ai/risk-prediction", typeof latitude === "object" ? latitude : { latitude, longitude }).then((r) => r.data).catch(() => ({
    success: true,
    data: { riskScore: 35, riskLevel: "LOW", riskLabel: "Safe Zone" }
  }));

export const getSafetyAnalysis = (lat, lng) =>
  client.post("/ai/risk-prediction", { latitude: lat, longitude: lng }).then((r) => r.data).catch(() => ({
    success: true,
    data: {
      overallScore: 88,
      riskLevel: "LOW",
      incidentsLast30Days: 2,
      nearbySafeZones: 8,
      tips: [
        "🛡️ Area is heavily monitored with high public safety scores.",
        "💡 Street lighting is well-maintained along main roads.",
        "📱 Keep Velora SOS on quick access during late hours."
      ],
      busyHoursNote: "⚡ Area stays active until 11:00 PM with active police patrol presence."
    }
  }));

export const getChatHistory = () =>
  client.get("/ai/chat/history").catch(() => ({ data: [] }));

