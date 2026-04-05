Fetch the URL below and save it to the project knowledge base.

URL: $ARGUMENTS

Steps:
1. Use WebFetch to retrieve the full content of the URL.
2. Extract and structure the key details depending on the content type:
   - **Hotel:** name, location, price range, amenities, rating, booking URL
   - **Flight:** route, airline, departure/arrival times, price, booking URL
   - **Restaurant:** name, cuisine, location, price range, hours, rating, notable dishes
   - **General:** title, summary (3–5 sentences), key facts, source URL
3. Read the file `docs/knowledge-base.md`. If it does not exist, create it with a header.
4. Append a new entry to `docs/knowledge-base.md` using this format:

```
## [Title or Name]
- **Type:** [Hotel / Flight / Restaurant / Article / Other]
- **URL:** [original URL]
- **Saved:** [today's date]
[Structured key details from step 2 as bullet points]

---
```

5. Tell the user what was saved and which file it was written to.
