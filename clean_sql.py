import re

with open('backup.sql', 'r') as f:
    content = f.read()

# Remove CREATE TABLE d1_migrations block
content = re.sub(r'CREATE TABLE d1_migrations\([\s\S]*?\);\n', '', content)

# Remove INSERT INTO d1_migrations lines
content = re.sub(r'INSERT INTO "d1_migrations".*?;\n', '', content)

with open('backup_clean.sql', 'w') as f:
    f.write(content)
