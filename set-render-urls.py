import os
import glob

html_files = glob.glob("*.html")
js_files = glob.glob("*.js")
all_files = html_files + js_files

old_api_1 = "http://localhost:5000/api"
old_api_2 = "const API_BASE = '/api';"
new_api = "https://software-e857.onrender.com/api"
new_api_2 = "const API_BASE = 'https://software-e857.onrender.com/api';"

for file_path in all_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    modified = False
    if old_api_1 in content:
        content = content.replace(old_api_1, new_api)
        modified = True
    if old_api_2 in content:
        content = content.replace(old_api_2, new_api_2)
        modified = True
        
    if modified:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file_path}")

print("Done.")