# RFP output templates (Proposal Manager)

**Document generation** now uses structured outlines in `juno-backend/data/rfp-response-templates.json` (with attribution in `data/ATTRIBUTION.md`). The backend calls OpenAI to **map workspace Q&As into those sections**, then builds a Word document. An **Annex** at the end includes the raw Q&A for verification.

Legacy binary `.docx` / `.pdf` “shell merge” templates are no longer used.

To add a new outline, extend the JSON file with a new `templates[]` entry, then add a matching option in the Proposal Manager workspace (`TEMPLATE_OPTIONS`) and locale strings.
