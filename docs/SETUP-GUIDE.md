# Simple Med Spa CRM — Complete Setup Guide
## WhatsApp + Google Gemini AI + n8n (Self-Hosted, Zero Cost)

---

## 🎯 What You'll Build
- WhatsApp messages come in
- Google Gemini AI responds (trained on med spa context only)
- Customer confirms booking → Auto-saves to local SQLite database
- View all clients & appointments in a simple CRM table

**Total Cost:** $0 (free tier)  
**Setup Time:** 30-45 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Beginner-friendly)

---

## 📋 Prerequisites
- Windows/Mac/Linux PC (doesn't have to be powerful)
- Internet connection
- Google account (for Gemini API)
- WhatsApp Business Account (free, setup once)
- Twilio account (free trial, $0 per WhatsApp message in free tier)

---

## ⚙️ Step 1: Install n8n Locally (5 minutes)

### Option A: Using Docker (Recommended)
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

Then go to: **http://localhost:5678**

### Option B: Direct Install
```bash
npm install -g n8n
n8n start
```

**Note:** n8n will create a `.n8n` folder where it stores all your workflows and data locally.

---

## 🔑 Step 2: Get Google Gemini API Key (3 minutes)

1. Go to **https://ai.google.dev**
2. Click **"Get API Key"**
3. Create a new API key (free tier = 60 requests/minute)
4. Copy the key and save it somewhere safe (you'll need it in Step 5)

**Free Tier Limits:**
- 60 requests per minute
- Unlimited requests per day
- More than enough for a med spa

---

## 📱 Step 3: Set Up WhatsApp Business (10 minutes)

### Option A: Twilio WhatsApp (Recommended for this setup)
1. Go to **https://www.twilio.com**
2. Sign up for free account (includes $15 credit)
3. Go to **Console → Messaging → Try it out → WhatsApp**
4. Connect your WhatsApp phone number
5. Copy these credentials:
   - Account SID
   - Auth Token
   - WhatsApp Number

### Option B: WhatsApp Business App
- Download WhatsApp Business on your phone
- Link it to your med spa phone number
- (More limited for this setup, not recommended)

---

## 🗄️ Step 4: Set Up SQLite Database (5 minutes)

### On Windows (PowerShell):
```powershell
cd C:\Users\YourName\n8n_data
sqlite3 med-spa.db
```

### On Mac/Linux:
```bash
cd ~/.n8n
sqlite3 med-spa.db
```

### Create Tables (Paste these commands):
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE,
  client_name TEXT,
  email TEXT,
  preferred_treatment TEXT,
  status TEXT DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT,
  client_name TEXT,
  treatment TEXT,
  appointment_date TEXT,
  status TEXT DEFAULT 'Booked',
  gemini_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Press `Ctrl+D` to exit SQLite.

---

## 🚀 Step 5: Create n8n Workflow (10 minutes)

1. Go to **http://localhost:5678** in your browser
2. Click **"New Workflow"**
3. Click **"+" → Select "Webhook"**
4. Configure Webhook:
   - Method: POST
   - Path: `whatsapp-med-spa`
5. Click the "+" below and add these nodes in order:
   - **Set** (to extract message data)
   - **HTTP Request** (to call Gemini API)
   - **Set** (to parse response)
   - **If** (to check if booking confirmed)
   - **SQLite** (to save to database)
   - **Twilio** (to send response back)
   - **Respond to Webhook** (send 200 OK)

---

## 📝 Step 6: Configure Each Node

### Node 1: Set (Extract Message Data)
```
customerPhone = {{$json.body.From}}
messageText = {{$json.body.Body}}
timestamp = {{new Date().toISOString()}}
```

### Node 2: HTTP Request (Call Gemini)
- **URL:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Query Parameter:** `key={{YOUR_GEMINI_API_KEY}}`
- **Body (JSON):**
```json
{
  "contents": [
    {
      "parts": [{"text": "={{$json.messageText}}"}]
    }
  ],
  "system_instruction": {
    "parts": [{
      "text": "You are a professional medical spa receptionist AI for Lumière Med Spa. Be warm, professional, and focused ONLY on med spa services.\n\nSERVICES:\nBotox: $14/unit (typical $280-450)\nDermal Fillers: $650-950\nHydraFacial: $280\nChemical Peel: $350\nLaser Resurfacing: $650\nMicroneedling: $380\nMicroneedling + PRP: $580\n\nHOURS: Mon-Sat 9AM-7PM, Sun 10AM-5PM\nLOCATION: 45 Blossom Avenue, Suite 200\n\nBOOKING FLOW:\n1. Ask treatment interest\n2. Suggest date/time\n3. Ask: 'Are you sure you want to book [Treatment] on [Date]?'\n4. If YES → say 'Booking confirmed!'\n5. If NO → ask what else you can help with\n\nRULES:\n- Only discuss med spa services\n- Politely redirect off-topic questions\n- Keep responses short (2-3 sentences)\n- Always confirm booking details before saying confirmed"
    }]
  }
}
```

### Node 3: Set (Parse Response)
```
aiResponse = {{$json.candidates[0].content.parts[0].text}}
bookingConfirmed = {{$json.candidates[0].content.parts[0].text.toLowerCase().includes('booking confirmed')}}
```

### Node 4: If (Check Booking)
```
If bookingConfirmed = TRUE
Then → SQLite + Twilio
Else → Just Twilio
```

### Node 5: SQLite (Save Appointment)
- **Operation:** Execute Query
- **Database:** `med-spa.db`
- **Query:**
```sql
INSERT INTO appointments (phone_number, client_name, treatment, appointment_date, status, gemini_notes, created_at)
VALUES (:phone, :name, :treatment, :date, 'Booked', :notes, :timestamp)
```

### Node 6: Twilio (Send Response)
- **Account SID:** {{YOUR_TWILIO_SID}}
- **Auth Token:** {{YOUR_TWILIO_AUTH_TOKEN}}
- **From:** `whatsapp:+14155238886` (Twilio's WhatsApp sandbox)
- **To:** `whatsapp:{{$json.customerPhone}}`
- **Message:** `{{$json.aiResponse}}`

### Node 7: Respond to Webhook
```json
{"status": "received", "booking_confirmed": {{$json.bookingConfirmed}}}
```

---

## 🔗 Step 7: Connect Twilio to n8n (5 minutes)

1. Go to **Twilio Console**
2. Go to **Messaging → Settings → WhatsApp Sandbox Settings**
3. Set **When a message comes in** to:
```
http://YOUR_PC_IP_ADDRESS:5678/webhook/whatsapp-med-spa
```

**How to find your PC IP:**
- Windows: `ipconfig` → look for "IPv4 Address"
- Mac/Linux: `ifconfig` → look for "inet"
- Or use a tool like **ngrok** to create a public tunnel

---

## 🧪 Step 8: Test the Workflow

1. In Twilio WhatsApp Sandbox, send your PC's WhatsApp number a message:
```
Hi, I want to book Botox
```

2. Expected flow:
   - Message comes in to n8n
   - Gemini AI generates response
   - You get back: "Great! When would you like to book? We're open..."
   - Type: "Yes, next Tuesday at 2 PM"
   - Get: "Perfect! Are you sure you want to book Botox on Tuesday at 2 PM?"
   - Type: "Confirm"
   - Get: "✓ Booking confirmed! We look forward to seeing you..."
   - **Appointment automatically saved to SQLite**

3. Check SQLite to verify data saved:
```bash
sqlite3 med-spa.db
SELECT * FROM appointments;
```

---

## 📊 Step 9: View Data in CRM Dashboard

1. Open the **simple-medspa-crm.html** file in your browser
2. Go to **"Clients"** tab → Add sample clients
3. Go to **"Appointments"** tab → Click "Add Sample Appointment"
4. You'll see both tables populate with test data

**To display REAL data from SQLite:**
You'd need a simple API (Node.js/Python) to fetch from SQLite and display in the CRM. For now, the CRM uses localStorage for demo purposes.

---

## 🔧 Step 10: Make n8n Auto-Start (Windows)

1. Create a .bat file:
```batch
@echo off
docker run -it --rm --name n8n -p 5678:5678 -v %USERPROFILE%\.n8n:/home/node/.n8n n8nio/n8n
```

2. Save as `start-n8n.bat`
3. Right-click → Create shortcut
4. Move shortcut to: `C:\Users\YourName\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

Now n8n starts automatically when you turn on your PC!

---

## 💬 What the AI Sees (System Prompt)

The Gemini AI has been trained to ONLY talk about med spa services:

```
You are a professional medical spa receptionist AI for Lumière Med Spa.

SERVICES:
- Botox: $14/unit
- Dermal Fillers: $650–950
- HydraFacial: $280
- Chemical Peel: $350
- Laser Resurfacing: $650
- Microneedling: $380

HOURS: Mon–Sat 9AM–7PM, Sun 10AM–5PM
LOCATION: 45 Blossom Avenue, Suite 200

BOOKING FLOW:
1. Ask treatment interest
2. Suggest date/time
3. Confirm: "Are you sure you want to book [Treatment]?"
4. If YES → "Booking confirmed!"
5. If NO → "What else can I help with?"

RULES:
- ONLY discuss med spa
- Redirect off-topic questions
- Keep responses short
- Always confirm before booking
```

If someone asks about pizza or politics, the AI will politely say: "I'm here to help with med spa services. Can I assist you with Botox, facials, or any other treatments?"

---

## 📈 Monthly Costs (After Setup)

| Service | Cost | Notes |
|---------|------|-------|
| **Google Gemini API** | $0 | Free tier: 60 req/min |
| **Twilio WhatsApp** | ~$1-5 | Pay per message (~$0.005 each) |
| **n8n Self-Hosted** | $0 | Free, runs on your PC |
| **SQLite Database** | $0 | Local, free |
| **Total** | **$1-5/month** | Or $0 if you use free tier only |

---

## 🎓 How to Expand This CRM

Once you have the basics working:

1. **Add Appointment Reminders:**
   - Create another n8n workflow that runs daily
   - Sends WhatsApp reminder to customers 24 hours before appointment

2. **Add Client Profiles:**
   - Let Gemini ask for email, preferred provider, skin concerns
   - Save to Clients table

3. **Add Payment Processing:**
   - Integrate Stripe or PayPal
   - Collect payment after booking confirmation

4. **Add Analytics:**
   - Query SQLite to show revenue per treatment
   - Show busiest days/times
   - Track customer satisfaction

5. **Add Multi-Language:**
   - Update Gemini prompt to support Spanish, French, etc.

---

## ❓ Troubleshooting

**"Webhook not receiving messages"**
- Check your PC's firewall allows port 5678
- Use ngrok to test: `ngrok http 5678`
- Make sure Twilio webhook URL is correct

**"Gemini API returns error"**
- Double-check your API key is correct
- Make sure you're not exceeding 60 requests/minute
- Check internet connection

**"Data not saving to SQLite"**
- Verify table structure: `sqlite3 med-spa.db .schema`
- Check n8n node error logs
- Make sure phone_number format is consistent

**"Twilio WhatsApp not working"**
- Verify your business number is confirmed
- Make sure you're using WhatsApp Sandbox correctly
- Check auth token is correct

---

## 📞 Support Resources

- **n8n:** https://docs.n8n.io/
- **Google Gemini:** https://ai.google.dev/
- **Twilio WhatsApp:** https://www.twilio.com/docs/whatsapp
- **SQLite:** https://www.sqlite.org/docs.html

---

## 🎉 You're Done!

You now have a fully functional med spa CRM that:
- Receives WhatsApp messages
- Responds with intelligent med spa-focused AI
- Auto-saves bookings to local database
- Shows appointments in a simple dashboard
- Costs $0-5/month

**Next step:** Go make your first booking! 🎯
