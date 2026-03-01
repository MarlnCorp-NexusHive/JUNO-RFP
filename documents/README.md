# Pre-uploaded Source Documents

Place your RFP document files in this folder to show them as **pre-uploaded** on the Source Docs page (`/rbac/proposal-manager/source-docs`).

**Supported formats:** PDF, DOC, DOCX, TXT, XLS, XLSX

**How it works:** Files here are served at `/documents/` (e.g. `sample.pdf` → `http://localhost:3000/documents/sample.pdf`). The app is configured to list specific files from this folder as initial documents. To add or change which files appear, update the `PREUPLOADED_DOCS` list in `src/features/proposal-manager/components/SourceDocsPage.jsx` and add the corresponding file(s) here.

**Example:** To show "Company RFP Template.pdf" as pre-uploaded:
1. Put `Company RFP Template.pdf` in this folder.
2. In SourceDocsPage.jsx, add an entry to PREUPLOADED_DOCS: `{ id: 'pre-xxx', name: 'Company RFP Template.pdf', url: '/documents/Company RFP Template.pdf', type: 'application/pdf', size: 0, uploadedAt: '...', preUploaded: true }`
