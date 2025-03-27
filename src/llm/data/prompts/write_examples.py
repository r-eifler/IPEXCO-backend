import json

def format_example(example, example_type):
    """Format an example entry as a natural string."""
    result = []
    
    # Handle different input field names
    if "Question" in example:
        result.append(f"Question: {example['Question']}")
    elif "Input" in example:
        result.append(f"Input: {example['Input']}")
    
    # Add all other fields except Return
    for key, value in example.items():
        if key not in ["Question", "Input", "Return"]:
            result.append(f"{key}: {value}")
    
    # Add formatted Return value
    if "Return" in example:
        try:
            # Try to parse and prettify the Return JSON if possible
            return_obj = json.loads(example["Return"])
            pretty_return = json.dumps(return_obj, indent=2)
            result.append(f"Return: {pretty_return}")
        except json.JSONDecodeError:
            # If it's not valid JSON, use as is
            result.append(f"Return: {example['Return']}")
    
    # Add a separator between examples
    result.append("\n" + "-"*0 + "\n")
    
    return "\n".join(result)

def process_json_file(file_path):
    """Process the JSON file and format all examples."""
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    formatted_output = []
    
    # Process question translator examples
    if "qt_examples" in data and data["qt_examples"]:
        formatted_output.append("# Question Translator Examples\n")
        # Add the prompt for question translator
        if "question_translator" in data:
            formatted_output.append(data["question_translator"])
            formatted_output.append("\n## Examples\n")
        
        for example in data["qt_examples"]:
            formatted_output.append(format_example(example, "qt"))
    
    # Process goal translator examples
    if "gt_examples" in data and data["gt_examples"]:
        formatted_output.append("# Goal Translator Examples\n")
        # Add the prompt for goal translator
        if "goal_translator" in data:
            formatted_output.append(data["goal_translator"])
            formatted_output.append("\n## Examples\n")
        
        for example in data["gt_examples"]:
            formatted_output.append(format_example(example, "gt"))
    
    # Process explanation translator examples
    if "et_examples" in data and data["et_examples"]:
        formatted_output.append("# Explanation Translator Examples\n")
        # Add the prompt for explanation translator
        if "explanation_translator" in data:
            formatted_output.append(data["explanation_translator"])
            formatted_output.append("\n## Examples\n")
        
        for example in data["et_examples"]:
            formatted_output.append(format_example(example, "et"))
    
    return "\n".join(formatted_output)

def main():
    # Replace with your actual file path
    file_path = "src/llm/data/prompts/parentsafternoon/prompts.json"
    formatted_text = process_json_file(file_path)
    
    # Write the formatted output to a file
    with open("src/llm/data/prompts/parentsafternoon/formatted_examples.txt", "w") as f:
        f.write(formatted_text)
    
    print("Successfully formatted examples to formatted_examples.txt")

if __name__ == "__main__":
    main()