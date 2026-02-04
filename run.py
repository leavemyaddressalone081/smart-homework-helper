from ai import ask_ai

while True:
    prompt = input("YOU: ")
    if prompt.lower() in ["exit", "quit"]:
        break

    reply = ask_ai(prompt)
    print("AI:", reply)
