# Tic-Tac-Toe on S3 (Free Tier) via GitHub Actions

A chalkboard-themed tic-tac-toe game, hosted on an S3 static website bucket,
deployed automatically by GitHub Actions using keyless (OIDC) AWS access.

## Repo layout

```
public/                          the game (plain HTML/CSS/JS, no build step)
infrastructure/
  bootstrap-oidc-role.yaml       one-time: OIDC provider + deploy role
  s3-website.yaml                the S3 bucket (deployed every push)
.github/workflows/deploy.yml     the CI/CD pipeline
```

## Why two CloudFormation templates?

GitHub Actions needs an IAM role to exist *before* it can authenticate to
AWS. So the role that GitHub Actions will use can't itself be created by
GitHub Actions -- that's a chicken-and-egg problem. You deploy
`bootstrap-oidc-role.yaml` once, manually, with your own AWS credentials.
After that, every push to `main` deploys `s3-website.yaml` automatically.

## One-time setup (do this once, from your own machine)

**1. Deploy the bootstrap stack** (needs the AWS CLI configured with your
own credentials):

```bash
aws cloudformation deploy \
  --template-file infrastructure/bootstrap-oidc-role.yaml \
  --stack-name tic-tac-toe-bootstrap \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    GitHubOrg=navsinghca22 \
    GitHubRepo=Tic-Tac-Toe- \
    GitHubBranch=main
```

> If your AWS account already has a GitHub OIDC provider registered from a
> previous project, add `CreateOIDCProvider=false` to the overrides above
> (an account can only have one provider for
> `token.actions.githubusercontent.com`).

**2. Grab the role ARN** from the stack output:

```bash
aws cloudformation describe-stacks \
  --stack-name tic-tac-toe-bootstrap \
  --query "Stacks[0].Outputs[0].OutputValue" \
  --output text
```

**3. Add it to your GitHub repo** as a repository *variable* (not a secret
-- an ARN isn't sensitive, and workflow variables are simpler to reference):

- Go to `github.com/navsinghca22/Tic-Tac-Toe-` → **Settings** → **Secrets
  and variables** → **Actions** → **Variables** tab → **New repository
  variable**
- Name: `AWS_DEPLOY_ROLE_ARN`
- Value: the ARN from step 2

**4. Push to `main`.** The workflow will:
1. Assume the deploy role via OIDC (no AWS keys stored anywhere)
2. Deploy/update the `s3-website.yaml` stack
3. Sync `public/` to the bucket
4. Print the website URL in the job log

## Costs

Everything here uses S3 Standard storage only -- no CloudFront, no Lambda.
Within the AWS Free Tier (first 12 months): 5GB storage, 20,000 GET and
2,000 PUT requests per month. A tic-tac-toe game is a handful of KB, so
you'd need to be very popular to come close to those limits. After the
free tier expires, cost is a few cents a month at this scale.

One caveat: S3 static website hosting serves over plain HTTP, not HTTPS.
If you want HTTPS later, that requires adding CloudFront in front of the
bucket, which is a separate (still mostly free-tier-friendly) step.

## Local preview

No build step -- just open `public/index.html` directly in a browser, or
serve it locally:

```bash
python3 -m http.server -d public 8000
```
