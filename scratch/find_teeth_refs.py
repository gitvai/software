import os

workspace_dir = r"c:\Users\vaibh_1mm1mpt\Desktop\ "

for root, dirs, files in os.walk(workspace_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file == "edit-order.html" or file == "new-order.html":
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Check for teeth indicators
                lines = content.split("\n")
                for i, line in enumerate(lines):
                    if any(x in line for x in ["tooth-btn", "teeth-btn", "tooth-grid", "teeth-grid", "18", "21", "31", "41"]):
                        print(f"{file}:{i+1}: {line.strip()}")
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
