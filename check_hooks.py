import os
import re

hooks_pattern = re.compile(r'\b(use[A-Z]\w*)\s*\(')
return_pattern = re.compile(r'^\s*if\s*\(.*\)\s*return\b')

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    in_component = False
    has_returned = False
    issues = []
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Check if early return
        if (stripped.startswith('if ') or stripped.startswith('if(')) and 'return ' in stripped and not stripped.startswith('//'):
            # Check if this return statement is inside a helper or component body
            has_returned = True
            return_line = (i, stripped)
            
        # Check if hook called
        matches = hooks_pattern.findall(line)
        if matches:
            for match in matches:
                # ignore custom hook definitions like export function useI18n()
                if stripped.startswith('export function use') or stripped.startswith('function use'):
                    continue
                if has_returned:
                    issues.append(f"Line {i}: Hook '{match}' called after return statement at line {return_line[0]}: '{return_line[1]}'")

        # Reset has_returned if function ends (closing brace at column 0/2 or export default function etc)
        if stripped.startswith('export default') or stripped.startswith('export function') or stripped.startswith('function '):
            has_returned = False

    return issues

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            issues = check_file(path)
            if issues:
                print(f"=== {path} ===")
                for iss in issues:
                    print("  ", iss)
