import os

workspace_dir = r"c:\Users\vaibh_1mm1mpt\Desktop\ "

for root, dirs, files in os.walk(workspace_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file.endswith(".html") or file.endswith(".js"):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Check for productType in the content
                if "productType" in content:
                    lines = content.split("\n")
                    for i, line in enumerate(lines):
                        if "productType" in line:
                            print(f"{file}:{i+1}: {line.strip()}")
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
