import streamlit as st
import requests
import re
import os
import time

def type_text(text, speed=0.02):
    placeholder = st.empty()
    typed = ""
    for char in text:
        typed += char
        placeholder.markdown(f"**✅ Answer:** {typed}")
        time.sleep(speed)
        
# Page config
st.set_page_config(page_title="📚 Safe Homework Helper", layout="centered")

# Title
st.title("📚 Safe Homework Helper AI")
st.write("Ask me any homework question! I help with all subjects in a clear, step-by-step way 😉.")

# Inappropriate content filter
INAPPROPRIATE_WORDS = [
    # Suicide & self-harm
    "suicidal", "kill myself", "killmyself", "kms", "end my life",
    "hang myself", "cut myself", "selfharm", "slit wrist",
    
    # Gore & violence
    "gore", "blood", "bloody", "killing", "stab", "stabbing",
    "shoot", "shooting", "gun", "knife", "weapon", "mutilate",
    
    # Sexual content
    "sex", "sexy", "porn", "porno", "pornography", "xxx", "nude", "naked",
    "strip", "stripper", "masturbate", "masturbation", "orgasm",
    "boob", "boobs", "tit", "tits", "breast", "breasts", "bobs", "boobies",
    "dick", "cock", "penis", "vagina", "pussy", "puss", "ass", "butt",
    "anal", "oral", "blowjob", "handjob", "rape", "molest", "pedophile",
    "child porn", "loli", "hentai", "nsfw",
    
    # Swear words & variations
    "fuck", "fucking", "fucked", "fucker", "fck", "fuk", "frick", "fricking",
    "shit", "shitty", "sht", "crap", "crappy", "damn", "dammit", "damm",
    "hell", "bitch", "bitching", "bastard", "asshole", "a$$hole",
    "motherfucker", "mf", "wtf", "stfu", "bullshit", "bs",
    
    # Drugs & alcohol
    "buy drug", "purchase drugs", "weed", "marijuana", "cocaine", "heroin", "meth",
    "ecstasy", "beer", "vodka",
    
    # Inappropriate references & people
    "diddy", "didy", "epstein", "weinstein", "cosby", "goon", "gooning",
    "onlyfans", "chaturbate", "pornhub",
    
    # Racial & hate speech
    "nigga", "nigger", "n1gga", "n1gger", "negro", "coon",
    "chink", "gook", "spic", "wetback", "beaner",
    "fag", "faggot", "dyke", "tranny", "trannie",
    "kkk", "white power", "supremacist",
    
    # Insults & bullying
    "retard", "retarded", "idiot", "stupid", "dumb", "moron",
    "ugly", "fat", "loser", "worthless", "pathetic", "weak",
    "whore", "slut", "hoe", "thot", "simp",
    
    # Scams & illegal
    "hack", "hacking", "cheat", "pirate", "steal", "scam",
    "bomb", "terrorist", "terrorism", "explosion",
    
    # Medical/adult only
    "abortion", "viagra", "cialis",
    
    # Bypasses & leetspeak
    "a$$", "b!tch", "sh!t", "fvck", "phuck", "azz",
]

def contains_inappropriate_content(text):
    cleaned = re.sub(r'[^a-z0-9\s]', '', text.lower())
    return any(word in cleaned for word in INAPPROPRIATE_WORDS)

# Hugging Face API
API_URL = "https://router.huggingface.co/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {st.secrets['HF_TOKEN']}",
    "Content-Type": "application/json"
}

def get_homework_help(question):
    payload = {
        "model": "mistralai/Mistral-7B-Instruct-v0.2",
        "messages": [
            {"role": "system", "content": "You are a smart homework tutor. Explain clearly and step by step."},
            {"role": "user", "content": question}
        ],
        "temperature": 0.2,
        "max_tokens": 300
    }

    response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=60)
    data = response.json()

    return data["choices"][0]["message"]["content"]

# Session history
if "history" not in st.session_state:
    st.session_state.history = []

# User input
user_input = st.text_input("💭 Ask your homework question:")

if user_input:
    if contains_inappropriate_content(user_input):
        answer = "Sorry, I can only help with appropriate content. Is there anything else you would like to ask me?"
    else:
        with st.spinner("Thinking..."):
            try:
                answer = get_homework_help(user_input)
            except Exception:
                answer = "Something went wrong. Please try again."

    st.session_state.history.append({
        "question": user_input,
        "answer": answer
    })

# Display chat
if st.session_state.history:
    st.markdown("---")
    st.subheader("📝 Your Study Session")
    for i, chat in enumerate(st.session_state.history):
        st.markdown(f"**❓ Question {i+1}:** {chat['question']}")
        type_text(chat["answer"])

# Sidebar
with st.sidebar:
    st.header("📖 Subject Help")
    st.markdown("• 🔢 Math")
    st.markdown("• 🔬 Science")
    st.markdown("• 📚 English")
    st.markdown("• 🌍 History")
    st.markdown("• 💻 Computer Science")

    if st.button("🗑️ Clear Chat"):
        st.session_state.history = []
        st.rerun()

st.markdown("---")
st.markdown("🚀 Safe AI Homework Helper | Built for Students")
