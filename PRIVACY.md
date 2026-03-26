# Privacy Policy — education-mcp

**Effective date:** March 26, 2026
**Provider:** SceneView Tools

## 1. Overview

The `education-mcp` MCP server processes educational content generation requests locally. This policy describes how we handle data.

## 2. Data We Process

When you use the Service, we process:
- **Input parameters:** Topic names, subject areas, difficulty levels, and other configuration you provide to generate content.
- **No personal data required:** The Service does not require or collect personal information such as names, email addresses, student records, or institutional data.

## 3. Data We Do NOT Collect

- We do NOT collect student personally identifiable information (PII).
- We do NOT store input parameters or generated content.
- We do NOT use cookies or tracking mechanisms.
- We do NOT sell or share any data with third parties.
- We do NOT collect analytics or usage telemetry in the open-source version.

## 4. Data Processing

- All content generation happens locally on your machine or infrastructure.
- No data is transmitted to external servers in the open-source version.
- The Pro tier API may process requests server-side; in that case, inputs are processed in memory only and not stored after response delivery.

## 5. FERPA / COPPA / GDPR Compliance

- The Service is designed to be compatible with FERPA requirements as it does not process student education records.
- The Service does not knowingly collect data from children under 13 (COPPA).
- For GDPR: no personal data is collected or processed. The Service operates as a local tool.

## 6. Third-Party Services

The open-source version of this Service makes no external API calls. The Pro tier may use:
- Stripe for payment processing (subject to [Stripe's Privacy Policy](https://stripe.com/privacy)).

## 7. Security

- The Service runs as a local MCP server with no network exposure by default.
- No credentials, tokens, or secrets are stored.
- The source code is open for security audit under the MIT license.

## 8. Changes

We may update this policy as the Service evolves. Changes will be noted in the repository's changelog.

## 9. Contact

For privacy questions: open an issue at https://github.com/mcp-tools-lab/education-mcp/issues
