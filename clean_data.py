import re

with open('backup_data.sql', 'r') as f:
    content = f.read()

# Remove INSERT INTO d1_migrations lines
content = re.sub(r'INSERT INTO "d1_migrations".*?;\n', '', content)

# Prepend DELETE statements to clear existing data (to avoid conflicts)
# We need to know table names, but hardcoding for now based on known schema
header = "DELETE FROM articles;\nDELETE FROM volumes;\nDELETE FROM sqlite_sequence;\n"
content = header + content

with open('backup_data_clean.sql', 'w') as f:
    f.write(content)
