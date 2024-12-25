from huggingface_hub import login

# Prompt for Hugging Face token
token = input("Enter your Hugging Face access token: ")
login(token=token)

print("Successfully logged in to Hugging Face!")
