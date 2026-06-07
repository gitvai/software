import os
import glob

workspace = "."
html_files = glob.glob("*.html")
print("Found files:", html_files)

old_api = "https://software-e857.onrender.com/api"
new_api = "http://localhost:5000/api"

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if old_api in content:
        content = content.replace(old_api, new_api)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Not found in {file_path}")

print("Done.")
