A group member is submitting an expense. Parse the arguments and update the group expense ledger.

Arguments: $ARGUMENTS

---

## Argument Format

Accept any of these natural forms:
- `[amount] [description] for @user1 @user2` — payer covered specific members
- `[amount] [description] for group` — payer covered everyone in the group
- `[amount] [description] @user1 @user2` — shorthand, same as "for @user1 @user2"
- `[amount] [description] group` — shorthand for group split

If no "paid by" is specified, assume the current user submitted the expense (record as "me" or prompt if ambiguous).

---

## Steps

1. **Parse** the arguments to extract:
   - `amount` (numeric, required)
   - `description` (text label for the expense)
   - `paid_by` (who paid — a @username or "me")
   - `paid_for` (list of @usernames, or "group" meaning split equally among all known members)

2. **Read** `docs/expenses.md`. If it does not exist, create it with this header:
   ```
   # Group Expenses

   ## Ledger
   <!-- entries appended below -->

   ## Members
   <!-- add members as they appear, e.g. @alice, @bob -->

   ---
   ```

3. **Identify members**: Extract the full member list from the "Members" section. Add any new @usernames from this submission to that list.

4. **Append** a new entry under `## Ledger` in this format:
   ```
   | [date] | [paid_by] | [amount] | [description] | [paid_for: comma-separated or "group"] |
   ```
   Use today's date (YYYY-MM-DD).

5. **Calculate balances**: Read all ledger rows and compute each person's net balance:
   - When `paid_for` is "group", split the amount equally among all known members.
   - When `paid_for` lists specific users, split equally among only those users.
   - The payer's balance increases by the full amount; each beneficiary's balance decreases by their share.
   - Net balance = total paid out − total owed.

6. **Update** (or create) a `## Balances` section at the bottom of `docs/expenses.md` with the current net for every member:
   ```
   ## Balances
   | Member | Net Balance | Status |
   |--------|------------|--------|
   | @alice | +TWD 250   | owed money |
   | @bob   | -TWD 125   | owes money |
   | @carol | -TWD 125   | owes money |
   ```
   Positive = others owe this person. Negative = this person owes others.

7. **Reply** to the user with:
   - Confirmation of what was recorded (amount, description, split)
   - A brief settlement summary: who owes what to whom (only non-zero balances)
   - Example: "@bob owes @alice TWD 125 · @carol owes @alice TWD 125"
