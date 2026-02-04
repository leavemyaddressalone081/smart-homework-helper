import os
import requests

HF_TOKEN = os.environ["HF_TOKEN"]

API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3.2"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}"
}

def ask_ai(prompt):
    response = requests.post(
        API_URL,
        headers=headers,
        json={"inputs": prompt}
    )
    return response.json()
