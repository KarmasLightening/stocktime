from transformers import AutoModelForCausalLM, AutoTokenizer

# List of open-source models to try
open_source_models = [
    "microsoft/phi-2",  # Microsoft's small but powerful model
    "google/gemma-2b",  # Google's open model
    "EleutherAI/pythia-2.8b",  # Open-source alternative
]

def verify_model(model_name):
    try:
        print(f"Attempting to load model: {model_name}")
        
        # Try to load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("Tokenizer loaded successfully!")
        
        # Try to load model
        model = AutoModelForCausalLM.from_pretrained(model_name)
        print("Model loaded successfully!")
        
        # Optional: Test a simple generation
        input_text = "Hello, how are you?"
        inputs = tokenizer(input_text, return_tensors="pt")
        outputs = model.generate(**inputs, max_new_tokens=20)
        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        print("\nGenerated Text:")
        print(generated_text)
        return True
    
    except Exception as e:
        print(f"Error loading {model_name}: {e}")
        return False

# Try each model until one works
for model in open_source_models:
    if verify_model(model):
        print(f"\n✅ Successfully verified {model}")
        break
else:
    print("❌ Could not load any alternative models")
