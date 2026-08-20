---
trigger: always_on
---

# Graphify Code Architecture Rule

Before executing any file searches, broad `grep` queries, or reading full repository source files:

1. **Always Check the Graph Report First:** Open and read `graphify-out/GRAPH_REPORT.md` to identify the relevant architectural modules, entry points, and dependency connections for the user's task.
2. **Isolate Specific Files:** Use the graph report to pinpoint the exact 1 to 3 source files that need modifications.
3. **Targeted Reading Only:** Only open and load those specifically identified source files into context. Do not perform full project file-scanning dumps.