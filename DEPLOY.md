# Production Deployment

1. Copy `.env.example` to `.env` and set a real SMTP provider.
2. Keep `DRY_RUN=true` while validating imports, templates and queue behavior.
3. Set a strong `API_KEY` and send it as `x-api-key` for API calls.
4. Run `npm ci` and `npm start` behind a TLS-enabled reverse proxy/process supervisor.
5. Export/backup `data/email_automation.db` regularly.
6. Configure a public HTTPS unsubscribe endpoint and ensure it maps the contact identifier securely.
7. Start with a conservative `MAX_PER_MINUTE` and increase only within your mail provider's documented limits.

The app deliberately sends only to contacts whose `consent=1` and `unsubscribed=0`. Queue insertion is idempotent per campaign/contact pair.

## Excel columns
`email` is required. Optional: `name`, `company`, `job_title`, `consent`.
Duplicate email addresses are normalized to lowercase and duplicate rows within an import are reported.

## API examples
Create campaign:
```bash
curl -H 'x-api-key: change-me' -H 'content-type: application/json' \\
  -d '{"name":"Java Outreach","subject":"{{job_title}} opportunity","body_html":"<p>Hi {{name}},</p><p>...</p><p><a href=\"{{unsubscribe_url}}\">Unsubscribe</a></p>","body_text":"Hi {{name}},\\n\\n...\\n\\n{{unsubscribe_url}}","followup_days":5}' \\
  http://localhost:4000/api/campaigns
```
Queue campaign:
```bash
curl -H 'x-api-key: change-me' -H 'content-type: application/json' -d '{}' http://localhost:4000/api/campaigns/1/queue
```
