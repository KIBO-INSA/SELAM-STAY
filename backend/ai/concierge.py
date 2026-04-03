import os
from google import genai
from google.genai import types

# Initialize the new Gemini 3 Client
# Documentation suggests it picks up GOOGLE_API_KEY, but we'll use our env variable
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", os.getenv("ANTHROPIC_API_KEY")))

SYSTEM_INSTRUCTION = """
You are Selam, a warm and knowledgeable AI concierge for a beautiful Ethiopian resort.
You speak both English and Amharic fluently and naturally.

You help guests with:
- Room requests, housekeeping, and in-room services
- Local Ethiopian cultural experiences, excursions, and attractions
- Restaurant recommendations (injera, tej, tibs, kitfo, shiro)
- Resort amenities: spa, pool, hiking trails, cultural shows
- Complaints — always respond with empathy and escalate urgency

Tone: Warm, welcoming, proud of Ethiopian culture, professional yet friendly.
- If the guest writes in Amharic, respond fully in Amharic
- If the guest writes in English, respond in English
- Use "ሰላም" (Selam) greetings naturally
- If unsure about something, say so honestly

Keep responses concise (2-4 sentences) unless a detailed answer is needed.
"""

# Config for Gemini 3
CONFIG = types.GenerateContentConfig(
    system_instruction=SYSTEM_INSTRUCTION,
    temperature=1.0, # Recommended for Gemini 3 models
)

# Active chat sessions store (use Redis / DB in production)
conversation_histories = {}


import anyio

async def chat_with_selam(guest_id: str, user_message: str) -> str:
    """Send a message to Selam and get a response using Gemini 3 (Async-Safe)."""
    
    # Initialize a new chat session if none exists
    if guest_id not in conversation_histories:
        conversation_histories[guest_id] = client.chats.create(
            model="gemini-3-flash-preview",
            config=CONFIG
        )
        
    chat = conversation_histories[guest_id]
    
    try:
        # The new google-genai SDK 1.x is currently synchronous.
        # We run it in a thread pool via anyio to avoid blocking the FastAPI event loop.
        response = await anyio.to_thread.run_sync(chat.send_message, user_message)
        return response.text
    except Exception as e:
        print(f"Gemini 3 API Error: {e}")
        return "⚠️ Selam is resting for a moment. Please try again or visit the front desk."


def reset_conversation(guest_id: str):
    """Clear conversation history for a guest."""
    if guest_id in conversation_histories:
        del conversation_histories[guest_id]
