import re

path = "src/pages/project-setup/ProjectSetup.tsx"

with open(path, "r") as f:
    content = f.read()

# Extract the broken useEffect block
effect_match = re.search(r"useEffect\(\(\) => \{[\s\S]*?\}, \[projectId\]\);", content)

if not effect_match:
    print("❌ Could not find useEffect block")
    exit()

effect_block = effect_match.group(0)

# Remove it from inside useMemo
content = content.replace(effect_block, "")

# Insert it ABOVE workflowStatus
content = content.replace(
    "const workflowStatus = useMemo",
    effect_block + "\n\nconst workflowStatus = useMemo"
)

with open(path, "w") as f:
    f.write(content)

print("✅ Moved useEffect out of useMemo")
