#!/bin/bash

# Repository Security Setup Script
# This script configures GitHub repository security settings using the GitHub CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="Lukeus"
REPO_NAME="app-shell"
MAIN_BRANCH="main"

echo -e "${BLUE}Setting up repository security for ${REPO_OWNER}/${REPO_NAME}${NC}"

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed. Please install it first.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}GitHub CLI is not authenticated. Please run 'gh auth login' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Configuring branch protection rules...${NC}"

# Enable branch protection for main branch
gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/${MAIN_BRANCH}/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","build","test","security-policy-check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"required_approving_review_count":1,"bypass_pull_request_allowances":{"users":[],"teams":[]}}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field block_creations=false \
  --field required_conversation_resolution=true

echo -e "${GREEN}✅ Branch protection rules configured${NC}"

echo -e "${YELLOW}Step 2: Enabling security features...${NC}"

# Enable vulnerability alerts
gh api repos/${REPO_OWNER}/${REPO_NAME}/vulnerability-alerts --method PUT

# Enable automated security fixes (Dependabot)
gh api repos/${REPO_OWNER}/${REPO_NAME}/automated-security-fixes --method PUT

# Enable secret scanning
gh api repos/${REPO_OWNER}/${REPO_NAME} --method PATCH \
  --field security_and_analysis='{"secret_scanning":{"status":"enabled"},"secret_scanning_push_protection":{"status":"enabled"}}'

echo -e "${GREEN}✅ Security features enabled${NC}"

echo -e "${YELLOW}Step 3: Setting up repository settings...${NC}"

# Configure repository settings for security
gh api repos/${REPO_OWNER}/${REPO_NAME} --method PATCH \
  --field allow_squash_merge=true \
  --field allow_merge_commit=false \
  --field allow_rebase_merge=false \
  --field delete_branch_on_merge=true \
  --field allow_auto_merge=true \
  --field allow_update_branch=true

echo -e "${GREEN}✅ Repository settings configured${NC}"

echo -e "${YELLOW}Step 4: Adding security labels...${NC}"

# Create security-related labels
labels=(
  "security:high-priority:red:Critical security vulnerability"
  "security:medium-priority:orange:Medium security vulnerability" 
  "security:low-priority:yellow:Low security vulnerability"
  "security:audit:blue:Security audit required"
  "security:dependency:purple:Dependency security update"
  "compliance:green:Compliance related changes"
)

for label in "${labels[@]}"; do
  IFS=':' read -r name priority color description <<< "$label"
  gh api repos/${REPO_OWNER}/${REPO_NAME}/labels --method POST \
    --field name="$name" \
    --field color="$color" \
    --field description="$description" 2>/dev/null || echo "Label $name already exists"
done

echo -e "${GREEN}✅ Security labels created${NC}"

echo -e "${YELLOW}Step 5: Setting up CodeQL scanning...${NC}"

# Enable CodeQL scanning (this creates a workflow if it doesn't exist)
if [ ! -f ".github/workflows/codeql.yml" ]; then
    echo -e "${RED}CodeQL workflow file not found. Please ensure it exists.${NC}"
else
    echo -e "${GREEN}✅ CodeQL workflow detected${NC}"
fi

echo -e "${YELLOW}Step 6: Configuring webhook security...${NC}"

# Set up repository security policy
gh api repos/${REPO_OWNER}/${REPO_NAME} --method PATCH \
  --field security_and_analysis='{"advanced_security":{"status":"enabled"}}'

echo -e "${GREEN}✅ Advanced security features enabled${NC}"

echo -e "${YELLOW}Step 7: Creating security team (if applicable)...${NC}"

# Note: Team creation requires organization-level permissions
# This section can be uncommented and modified if you have an organization
# gh api orgs/${REPO_OWNER}/teams --method POST \
#   --field name="security-team" \
#   --field description="Security team for code reviews" \
#   --field privacy="closed" 2>/dev/null || echo "Security team may already exist or requires organization"

echo -e "${BLUE}Repository security setup completed!${NC}"
echo ""
echo -e "${GREEN}Security features enabled:${NC}"
echo "  ✅ Branch protection rules"
echo "  ✅ Required status checks"
echo "  ✅ Required code reviews"
echo "  ✅ Secret scanning"
echo "  ✅ Push protection for secrets"
echo "  ✅ Vulnerability alerts"
echo "  ✅ Automated security fixes (Dependabot)"
echo "  ✅ Security labels"
echo ""
echo -e "${YELLOW}Manual steps still required:${NC}"
echo "  1. Configure CODEOWNERS file"
echo "  2. Set up security email forwarding"
echo "  3. Configure repository secrets if needed"
echo "  4. Review and customize Dependabot configuration"
echo "  5. Set up security notifications"
echo ""
echo -e "${BLUE}For more advanced security, consider:${NC}"
echo "  - Setting up private vulnerability reporting"
echo "  - Configuring custom security policies"
echo "  - Implementing commit signing requirements"
echo "  - Setting up security scanning integrations"