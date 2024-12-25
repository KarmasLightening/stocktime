from transformers import LlamaModel, LlamaTokenizer

model_name = "meta-llama/Meta-Llama-3-8B"

try:
    # Try to load tokenizer
    tokenizer = LlamaTokenizer.from_pretrained(model_name)
    print("Tokenizer loaded successfully!")
    
    # Try to load model
    model = LlamaModel.from_pretrained(model_name)
    print("Model loaded successfully!")
    
except Exception as e:
    print(f"Error loading LLaMA3 model: {e}")
    print("Possible reasons:")
    print("1. No Hugging Face access token")
    print("2. Not approved for Meta LLaMA model")
    print("3. Network/download issues")
