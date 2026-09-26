# Security Policy

## Responsible Disclosure

If you discover a security vulnerability in any Meridian Protocol contract, please report it responsibly:

**Contact:** admin@meridianprotocol.site

Please include:
- Affected contract/address
- Description of the issue
- Steps to reproduce
- Potential impact

### Important

- **DO NOT** send private keys, seed phrases, wallet passwords, API keys, or any other credentials as part of a report
- **DO NOT** publicly disclose the vulnerability before Meridian Protocol has had reasonable time to respond and remediate
- **DO NOT** exploit any discovered vulnerability against mainnet contracts or user funds

## Expectations

Please allow reasonable time for the project team to:
1. Review and validate the report
2. Investigate the vulnerability
3. Develop and test a fix
4. Deploy mitigation where applicable
5. Communicate the resolution

## Bug Bounty Program

No formal bug-bounty program currently exists. This policy does not promise a reward for reports.

If a bug-bounty program is established in the future, it will be documented here with clear terms, eligible vulnerabilities, and reward amounts.

## Audit Status

- ✅ **Source Code Verified** on BscScan (all four contracts)
- 🔄 **Independent Manual Audit** — Planned and prioritized
- ⏳ **Audit Report** — Pending completion

See `docs/audit-scope.md`, `docs/audit-freeze.md`, and `docs/security.md` for full audit details.

## Security Considerations

All users should review:
1. [docs/security.md](docs/security.md) — Detailed security analysis
2. [docs/audit-scope.md](docs/audit-scope.md) — Audit scope and focus areas
3. Smart-contract interaction carries technical risk, including the possibility of undiscovered defects

## Reporting Template (Recommended)

```
Subject: SECURITY REPORT — Meridian Protocol

Vulnerability Title:
Affected Contract(s):
Affected Address(es):
Severity (Critical / High / Medium / Low):

Description:
[Your detailed description]

Steps to Reproduce:
1. 
2. 
3. 

Expected Behavior:

Actual Behavior:

Impact:

Proof of Concept (if applicable):

Recommended Fix:

Disclosure Timeline:
```

---

**Email:** admin@meridianprotocol.site
