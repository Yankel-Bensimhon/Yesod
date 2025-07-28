#!/usr/bin/env python3
import re
import sys

def escape_jsx_apostrophes(content):
    # Pattern pour trouver le contenu entre les guillemets doubles dans JSX
    # Cela correspond aux chaînes dans className, les textes entre balises, etc.
    
    # Échapper les apostrophes dans le contenu JSX seulement
    # Pattern pour le contenu entre balises JSX
    content = re.sub(r'>(.*?\'.*?)<', lambda m: '>' + m.group(1).replace("'", "&apos;") + '<', content, flags=re.DOTALL)
    
    # Pattern pour les attributs JSX
    content = re.sub(r'="([^"]*\'[^"]*)"', lambda m: '="' + m.group(1).replace("'", "&apos;") + '"', content)
    
    return content

if __name__ == "__main__":
    for filename in sys.argv[1:]:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed_content = escape_jsx_apostrophes(content)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"Fixed {filename}")
