import streamlit as st
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import re
import torch

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
    """Check if text contains inappropriate words (including alternative spellings)"""
    cleaned_text = re.sub(r'[^a-z0-9\s]', '', text.lower())
    for word in INAPPROPRIATE_WORDS:
        pattern = ''.join(f'{char}[^a-z0-9]*' for char in word)
        if re.search(pattern, cleaned_text):
            return True
    return False

# Load model and tokenizer (cached so it only loads once)
@st.cache_resource
def load_model():
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
    model = AutoModelForSeq2SeqLM.from_pretrained(
        "google/flan-t5-small",
        torch_dtype=torch.float32
    )
    model = model.to("cpu")
    return tokenizer, model

# Load model
with st.spinner("Loading AI model... (this may take a moment on first run)"):
    tokenizer, model = load_model()

def get_homework_help(question):
    """Generate homework help using the model"""
    try:
        prompt = f"Explain step-by-step in a clear and formal way: {question}"
        inputs = tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
        outputs = model.generate(
            inputs.input_ids,
            max_length=200,
            num_beams=4,
            early_stopping=True
        )
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
    except Exception:
        return "I'm having trouble processing this question. Please try rephrasing it."

# Initialize chat history
if 'history' not in st.session_state:
    st.session_state.history = []

# User input
user_input = st.text_input("💭 Ask your homework question:")

# Process input
if user_input:
    if contains_inappropriate_content(user_input):
        response = "Sorry, I can only help with appropriate content. Is there anything else you would like to ask me?"
    else:
        with st.spinner("Thinking..."):
            response = get_homework_help(user_input)
    st.session_state.history.append({
        "question": user_input,
        "answer": response
    })

# Display chat history
if st.session_state.history:
    st.markdown("---")
    st.subheader("📝 Your Study Session")
    for i, chat in enumerate(st.session_state.history):
        st.markdown(f"**❓ Question {i+1}:** {chat['question']}")
        st.markdown(f"**✅ Answer:** {chat['answer']}")
        st.markdown("")

# Sidebar
with st.sidebar:
    st.header("📖 Subject Help")
    st.write("I can help with:")
    st.markdown("• 🔢 Math")
    st.markdown("• 🔬 Science")
    st.markdown("• 📚 English")
    st.markdown("• 🌍 History")
    st.markdown("• 💻 Computer Science")
    st.markdown("• And more!")
    
    st.markdown("---")
    st.write("**Rules:**")
    st.caption("✓ Formal & clear explanations")
    st.caption("✓ Step-by-step answers")
    st.caption("✓ Appropriate content only")
    
    if st.button("🗑️ Clear Chat"):
        st.session_state.history = []
        st.rerun()

# Footer
st.markdown("---")
st.markdown("🚀 Safe AI Homework Helper | Built for Students")
