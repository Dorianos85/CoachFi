# WWW — prepared correction, not executed

> Historical preparation plan. The bounded WWW change was later executed and independently retested; see REPORT.md for the accepted result. No application deployment or mailbox provisioning followed from this plan.

Read-only Vercel observation on 19 October 2026, project `prj_zf8FTP5nuVPKNDYoAxaG59Y5Tj0t`, team `team_cKmnsf6dMutH8qZThLHAMlUa`:

- `www.coachfiai.com` has no project-domain assignment (404).
- `coachfiai.com` is assigned to this project and verified, with no redirect.
- The public DNS configuration for www reports CNAME `coachfiai.com.`, no conflicts and `misconfigured: false`. DNS correctness does not prove certificate coverage.

After independent review and root authorization, the exact proposed `add_project_domain` arguments are:

```json
{
  "idOrName": "prj_zf8FTP5nuVPKNDYoAxaG59Y5Tj0t",
  "teamId": "team_cKmnsf6dMutH8qZThLHAMlUa",
  "requestBody": {
    "name": "www.coachfiai.com",
    "redirect": "coachfiai.com",
    "redirectStatusCode": 308
  }
}
```

Re-read both assignments immediately before mutation. Stop if www now exists or the project/target differs. Do not force reassignment or change DNS, nameservers, MX, other domains or project source. A returned verification challenge is pending work, not certificate success.

Rollback, only if this attempt created the still-matching assignment: `DELETE /v9/projects/prj_zf8FTP5nuVPKNDYoAxaG59Y5Tj0t/domains/www.coachfiai.com?teamId=team_cKmnsf6dMutH8qZThLHAMlUa`, body `{"removeRedirects":false}`. Preserve apex assignment and domain registration.

Verify exact assignment/308 target, apex unchanged, normal TLS for www, and redirect of `/` and `/privacy` to the corresponding apex paths without loops. Never bypass a certificate warning. API success alone does not prove certificate propagation, production release or mailbox readiness.

Official references checked 19 October 2026: [add project domain](https://vercel.com/docs/rest-api/projects/add-a-domain-to-a-project), [remove project domain](https://vercel.com/docs/rest-api/projects/remove-a-domain-from-a-project). Exact read-only response projection and request are in workspace `evidence/release-pr19-2026-10-19/domain-plan.json`. No remote mutation was performed.
