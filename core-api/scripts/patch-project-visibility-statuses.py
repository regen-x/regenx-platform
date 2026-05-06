from pathlib import Path
import re
import sys

path = Path("/home/ubuntu/core/core-api/src/modules/project/application/service/project.service.ts")
text = path.read_text()

original = text

pattern_get_projects = re.compile(
    r"(async getProjects\(\)\s*\{\s*const projects = await this\.projectRepository\.find\(\{\s*where:\s*\{\s*)status: 'live' as any,",
    re.S,
)

replacement_get_projects = r"\1status: In(['approved', 'live']) as any,"

text, count1 = pattern_get_projects.subn(replacement_get_projects, text, count=1)

pattern_get_public_project = re.compile(
    r"(async getPublicProject\(id: string\)\s*\{\s*const project = await this\.projectRepository\.findOne\(\{\s*where:\s*\{\s*id: Number\(id\),\s*)status: 'live' as any,",
    re.S,
)

replacement_get_public_project = r"\1status: In(['approved', 'live']) as any,"

text, count2 = pattern_get_public_project.subn(replacement_get_public_project, text, count=1)

if count1 != 1 or count2 != 1:
    print(f"Patch failed. getProjects replacements={count1}, getPublicProject replacements={count2}")
    sys.exit(1)

if "In(['approved', 'live'])" not in text:
    print("Patch verification failed.")
    sys.exit(1)

path.write_text(text)
print("Patched project visibility filters successfully.")
