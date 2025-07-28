import re
import sys

def fix_jsx_apostrophes(content):
    # First, restore all &apos; to regular apostrophes
    content = content.replace('&apos;', "'")
    
    # Now, we need to carefully escape apostrophes only in JSX text content
    # Pattern to match JSX text content that contains apostrophes
    
    # Match text content between JSX tags that contains apostrophes
    def escape_jsx_text(match):
        full_match = match.group(0)
        # Only replace apostrophes in actual text content, not in attributes or JavaScript
        
        # Split the match to identify different parts
        parts = re.split(r'(\{[^}]*\}|"[^"]*"|\'[^\']*\')', full_match)
        
        result = []
        for part in parts:
            # Skip JavaScript expressions in {}, and quoted strings
            if (part.startswith('{') and part.endswith('}')) or \
               (part.startswith('"') and part.endswith('"')) or \
               (part.startswith("'") and part.endswith("'")):
                result.append(part)
            else:
                # This is plain text content - escape apostrophes
                result.append(part.replace("'", "&apos;"))
        
        return ''.join(result)
    
    # Pattern for JSX text content between tags
    jsx_text_pattern = r'>[^<{]*\'[^<{]*<'
    content = re.sub(jsx_text_pattern, escape_jsx_text, content)
    
    # Also handle single-line JSX content
    jsx_single_pattern = r'>\s*[^<{]*\'[^<{]*\s*<'
    content = re.sub(jsx_single_pattern, escape_jsx_text, content)
    
    return content

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = fix_jsx_apostrophes(content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    for file_path in sys.argv[1:]:
        process_file(file_path)
