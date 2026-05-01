import sys

filepath = "override_campus_zero (2).html"

with open(filepath, 'rb') as f:
    content = f.read()

text = content.decode('utf-8')

old_str = "};\n\n;\n\n;"
new_str = "};\n\nwindow.COMBAT = COMBAT;\n\n;\n\n;"

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Exposed COMBAT to window scope successfully!")
else:
    # Fallback if the exact sequence of semicolons varies
    import re
    # Match the end of COMBAT object followed by semicolon(s)
    match = re.search(r'document\.getElementById\("renderCanvas"\)\.focus\(\);\s*\}\s*\};\s*', text)
    if match:
        end_idx = match.end()
        text = text[:end_idx] + "\nwindow.COMBAT = COMBAT;\n" + text[end_idx:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print("Exposed COMBAT to window scope using regex!")
    else:
        print("Failed to find COMBAT end!")
