---
name: burmese-i18n
description: >-
  Apply Burmese (Myanmar) internationalization in this project: language-specific
  typography, extra vertical space for Myanmar script, and a keep-English policy
  for technical and well-known UI terms. Use when adding or editing translations,
  locale switching, Burmese copy, Myanmar script, line-height, or text styles
  that must follow the user's chosen language.
---

# Burmese i18n

English and Burmese need different typography. Style from the user's chosen language. Do not share one text style across languages.

## Language hook

Set the active language on the document, for example `<html lang="en">` or `<html lang="my">`. Drive font, line-height, letter-spacing, and transforms from that value (`:lang(en)` and `:lang(my)`).

In this repo, global text metrics live in `app/src/index.css`. Keep English rules as they are. Add Burmese rules under `:lang(my)`. Do not replace English metrics with a single compromise value.

## Typography

Myanmar script stacks consonants, medials, and vowels above and below the baseline. Tight English line-heights clip those marks.

When the chosen language is Burmese:

- Do not set a fixed tight `line-height`. Prefer `line-height: normal` so the Myanmar font's own metrics apply. If a number is required, use a larger value than the English rule (about `1.7` for body, `1.45` or higher for headings).
- Set `letter-spacing: normal`. Do not use negative tracking.
- Do not use `text-transform: uppercase` or `capitalize` on Burmese text.
- Give Burmese text more vertical space: padding, min-height, and line-clamp boxes sized for English will clip. Recalculate those from the Burmese line box.
- Load a Myanmar-capable face and use it only for `:lang(my)`. `DM Sans` does not cover Myanmar. Use `Noto Sans Myanmar` (weights 400–700), then the existing Latin stack as fallback.

English keeps its own metrics, including tight headings, negative letter-spacing, and compact controls whose labels stay English.

```css
:lang(my) {
  font-family: "Noto Sans Myanmar", "DM Sans", ui-sans-serif, system-ui, sans-serif;
}

:lang(my) :where(h1, h2, h3, p, li, label, input, textarea, button, a) {
  line-height: normal;
  letter-spacing: normal;
  text-transform: none;
}
```

Controls whose visible label stays English may keep English metrics. Any element that can render Burmese must use the Burmese rules while `lang` is `my`.

## What to translate

Leave these in English, including inside Burmese UI:

- Brand and product names (`Milly`)
- Technical terms: API, URL, email, SMS, ID, JSON, token, HTTP status names
- Currency codes: `USD`, `MMK`
- Well-known UI terms: Login, Logout, Sign up, Search, Filter, Save, Cancel, Edit, Delete, Settings, Profile, Menu, Admin, Dashboard, OK

Translate descriptive copy: sentences, helper text, empty states, validation explanations, and marketplace phrases that are not standard UI jargon.

User-written listing titles, descriptions, and names stay as the user wrote them.

If a natural Burmese phrase is uncertain, keep the English term. Do not invent a translation for a term on the keep-English list.

## Checklist

- [ ] `lang` on the document matches the user's chosen language
- [ ] Burmese text uses `line-height: normal` or a larger line-height than English
- [ ] No shared line-height, letter-spacing, or text-transform for both languages
- [ ] Myanmar font is applied only when Burmese is chosen
- [ ] Line clamps, fixed heights, and tight padding do not clip stacked marks
- [ ] Technical terms and well-known UI terms remain English
