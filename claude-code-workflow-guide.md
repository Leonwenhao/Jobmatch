# Claude Code Workflow Guide: Idea to Live Product

A practical guide for building projects with Claude Code, from initial concept to deployment.

---

## Phase 1: Planning

Before touching code, answer two questions and create two documents.

### The Two Questions

1. **What are you trying to build?**
   - Define the core product in one sentence
   - Identify key qualities (security, performance, error handling, etc.)

2. **What are the milestones of functionality?**
   - Break the project into sequential, buildable chunks
   - Each milestone should be independently testable

### The Two Documents

Have Claude interview you to create these:

**Product Requirements Document**
- Who is the product for?
- What problem does it solve?
- What does the product do?
- Key user flows and features

**Engineering Design Document**
- Tech stack decisions
- Architecture overview
- System design
- Technical constraints
- Third-party integrations

💡 *Tip: Create a brainstorm.md to capture raw thinking before formalizing into these docs.*

---

## Phase 2: Setup

Complete this checklist before building.

### 1. GitHub Repository

- [ ] Create repo
- [ ] Set up branch protection on `main`
- [ ] Establish branching convention (e.g., `feature/`, `fix/`, `chore/`)
- [ ] Enable issue-based development workflow

### 2. Environment Variables

- [ ] Ask Claude to generate `.env.example` based on your tech stack
- [ ] Create actual `.env` file with your credentials
- [ ] Add `.env` to `.gitignore`

### 3. CLAUDE.md (Project Memory)

Create this file in your project root. Keep it focused, not bloated.

**Include:**
- Project goal (1-2 sentences)
- Architecture overview (brief)
- Tech stack
- Design/UX guidelines
- Constraints and policies
  - e.g., "Never push directly to main"
  - e.g., "Always use environment variables for secrets"
- Repository etiquette (PR conventions, branch naming)
- Frequently used commands
- Links to other documentation files

**Example structure:**
```markdown
# Project Name

## Goal
[One sentence description]

## Tech Stack
- Frontend: 
- Backend: 
- Database: 
- Hosting: 

## Constraints
- Never push directly to main
- Always run tests before committing
- Use environment variables for all secrets

## Key Commands
- `npm run dev` - Start development server
- `npm test` - Run test suite

## Documentation
- [Architecture](./docs/architecture.md)
- [Changelog](./docs/changelog.md)
- [Project Status](./docs/project-status.md)
```

### 4. Automated Documentation

Create these files and link them from CLAUDE.md:

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| `architecture.md` | System design, app structure, component interactions | After major features |
| `changelog.md` | Record of changes over time | After each feature/fix |
| `project-status.md` | Milestones, accomplishments, what's next | Ongoing |

💡 *Tip: Create a custom slash command like `/update-docs-and-commit` to automate updates.*

### 5. Plugins

Manage with `/plugins` command. Add incrementally based on need.

### 6. MCP Servers

Install based on your tech stack:

| Use Case | MCP Server |
|----------|------------|
| Database (MongoDB) | MongoDB MCP |
| Database (Postgres) | Postgres MCP |
| Browser testing | Playwright MCP or Puppeteer MCP |
| Deployment | Vercel MCP |
| Analytics | Mixpanel MCP |
| Project management | Linear MCP |
| GitHub integration | GitHub MCP |

### 7. Slash Commands & Subagents

**Built-in subagents:**
- Planning subagent
- Codebase search subagent

**Recommended custom subagents:**
- Changelog subagent (auto-logs changes)
- Frontend testing subagent (checks UI)
- Retro agent (reviews sessions, suggests improvements)

**Recommended slash commands:**
- `/commit` - Stage and commit with message
- `/pr` - Create pull request
- `/feature-dev` - Full feature workflow
- `/update-docs-and-commit` - Update docs and commit

### Bonus: Advanced Setup

**Pre-configure permissions**
- Allow: test running, package installation, git operations on feature branches
- Restrict: pushing to main, deleting files outside project, arbitrary network requests

**Set up hooks**
- Stop hook: Run tests when Claude finishes; if tests fail, Claude keeps working
- Notification hook: Ping Slack when Claude needs input (for async work)

---

## Phase 3: Build

### Step 1: Build the MVP

1. Reference your project spec and milestones
2. Ask Claude to build milestone one
3. Request parallel subagents for independent components

### Step 2: Build Remaining Milestones

Choose your workflow based on complexity:

**Single Feature Workflow**
```
Research → Plan → Implement → Test
```

**Issue-Based Workflow**
1. Ask Claude to convert milestones into GitHub issues
2. Use GitHub CLI for issue/branch/PR management
3. Claude tackles multiple issues via subagents

**Multi-Agent Workflow**
- Use git worktrees for true parallel development
- Multiple Claude agents work on separate features simultaneously

### Ongoing Practices

**Update CLAUDE.md regularly**
- Create a slash command to update and commit CLAUDE.md
- Keep project memory current

**Practice regression prevention**
- When Claude makes a mistake, don't just fix it
- Use `#` to add instructions to CLAUDE.md
- Turn mistakes into permanent lessons

**Use checkpoints liberally**
- `Esc Esc` or `/rewind` to restore previous state
- Don't be afraid to throw code away and try again
- Experiment boldly knowing you can always roll back

---

## Quick Reference: File Structure

```
project-root/
├── CLAUDE.md              # Project memory (always read)
├── .env                   # Secrets (gitignored)
├── .env.example           # Template for env vars
├── docs/
│   ├── architecture.md    # System design
│   ├── changelog.md       # Change history
│   ├── project-status.md  # Current state & roadmap
│   └── [feature-docs]/    # Optional deep dives
├── .claude/
│   └── commands/          # Custom slash commands
└── [your source code]
```

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────┐
│                     PHASE 1: PLAN                       │
│  Answer: What to build? What are the milestones?        │
│  Create: Product Requirements + Engineering Design      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 2: SETUP                       │
│  GitHub repo → .env → CLAUDE.md → Docs → MCP → Commands │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    PHASE 3: BUILD                       │
│  MVP first → Remaining milestones → Iterate & improve   │
│  Update docs → Learn from mistakes → Use checkpoints    │
└─────────────────────────────────────────────────────────┘
                            ↓
                      🚀 LIVE PRODUCT
```

---

*This is a starter template. Refine it once project-specific details (tech stack, milestones, architecture) are defined.*
