# PROJECT MODE RULES (STRICT)

This project operates in TWO MODES:

---

# MODE 1: NEW PAGE CREATION (STRICT SCAFFOLD MODE)

When creating a NEW page/feature:

## Mandatory Structure
Must follow:

src/<mainTitle>/
├── controller/controller.tsx
├── repository/remote.tsx
├── view/
│   ├── index.tsx
│   ├── view.tsx
│   └── component/

## Rules
- ALWAYS create full structure (controller/repository/view)
- NEVER skip any layer
- NEVER put API logic inside view
- NEVER put UI logic inside controller
- ALWAYS register routes after creation

## Routing (mandatory)
- Browser route → browserRoutes.tsx (ONLY view/index.tsx)
- API route → apiRoutes.tsx (ONLY repository usage)

---

# MODE 2: EXISTING CODE MODIFICATION (SAFE EVOLUTION MODE)

When editing existing pages:

## Rules
- NEVER change folder structure
- NEVER rename folders/files without explicit instruction
- ONLY modify inside existing files
- Preserve controller/repository/view separation

## Allowed changes
✔ Fix bugs
✔ Add new functions
✔ Improve performance
✔ Add UI components inside existing view/component folder

## NOT allowed
✘ Moving files between folders
✘ Changing architecture pattern
✘ Breaking data flow rules

---

# MODE 3: LEGACY PROTECTION MODE (CRITICAL RULE)

For existing working features:

## RULES
- DO NOT BREAK OLD FEATURES
- DO NOT REFACTOR UNLESS ASKED
- DO NOT TOUCH GLOBAL WEB SOCKET FLOW
- DO NOT MODIFY datamapper unless required

---

# REALTIME SYSTEM RULE (NON-NEGOTIABLE)

- All websocket data must come from:
  client/src/GlobalWebsocket

- All transformations must go through:
  client/src/GlobalWebsocket/globalSocketDatamapper.tsx

---

# SAFE UPDATE FLOW

Before making ANY change:

1. Detect mode (NEW or EXISTING)
2. Identify affected folder
3. Check dependencies
4. Apply minimal safe change
5. Avoid cascading modifications

---

# GOLDEN RULE

If unsure:
→ DO NOT MODIFY
→ ASK OR SKIP