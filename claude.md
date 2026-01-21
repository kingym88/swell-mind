# CLAUDE.md

## ⚠️ CRITICAL RULES - READ BEFORE EVERY RESPONSE ⚠️

**RETRY LIMIT PROTOCOL (NON-NEGOTIABLE):**
Max 3 attempts per error with same approach. After 3 failures = STOP and ask user.

Before any code change, check: "Have I tried this approach before? Is this attempt #4+?"

## Error Handling and Retry Protocol

**CRITICAL RULE: Avoid Repeated Failed Fixes**

If you attempt to fix the same error more than 3 times using the same approach:

1. **STOP** and acknowledge the repeated failure
2. **Ask the user** for guidance before proceeding
3. **Propose alternative approaches** such as:
   - Researching the error in documentation or similar issues
   - Breaking down the problem into smaller steps
   - Using a different debugging strategy (add logging, write tests, etc.)
   - Reverting recent changes and trying a fundamentally different solution
   - Asking the user to clarify requirements or constraints

**Before each fix attempt:**

- State what approach you're trying and why it's different from previous attempts
- If you catch yourself repeating the same fix, STOP immediately

**Track your attempts:**

- Keep count of how many times you've tried fixing the same issue
- Document what you tried in a scratchpad or checklist
- After 3 failures, create a `debug_notes.md` with:
  - What you tried
  - Why it failed
  - What alternative approaches you're considering

## Debugging Workflow

When encountering errors:

1. **First attempt**: Try the most obvious fix
2. **Second attempt**: Add logging/debugging output to understand the issue better
3. **Third attempt**: Write a test that reproduces the error, then fix it
4. **After 3 failures**:
   - Run `/compact` to review conversation context
   - Create a detailed debugging plan before coding
   - Ask user: "I've tried 3 approaches without success. Should I [option A], [option B], or would you like to suggest a different direction?"

**Never:**

- Repeat the exact same fix twice
- Continue past 3 failed attempts without changing strategy
- Make assumptions about why previous attempts failed—investigate with logging/tests instead
