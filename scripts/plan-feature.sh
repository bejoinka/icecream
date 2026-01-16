#!/bin/bash
# Plan Feature - Launch planning agent to decompose work using Rule of 3
#
# Usage: ./scripts/plan-feature.sh <feature-branch> [worker-count]
# Example: ./scripts/plan-feature.sh awl-4000 3
#
# The planning agent will:
# 1. Pass 1 - Decompose: Break work into discrete units touching distinct files
# 2. Pass 2 - Dependencies: Identify ordering constraints, use bd dep add
# 3. Pass 3 - Conflict check: List files per unit, eliminate overlap or add constraints
# 4. Output: Create beads with bd create, set dependencies, ensure each is testable

set -e

FEATURE_BRANCH="$1"
WORKER_COUNT="${2:-3}"

if [ -z "$FEATURE_BRANCH" ]; then
    echo "Usage: $0 <feature-branch> [worker-count]"
    echo "Example: $0 awl-4000 3"
    exit 1
fi

echo "=== Planning Feature: $FEATURE_BRANCH ==="
echo "Target worker count: $WORKER_COUNT"
echo ""

# Create or switch to the feature branch
if git show-ref --verify --quiet "refs/heads/$FEATURE_BRANCH"; then
    echo "Switching to existing branch: $FEATURE_BRANCH"
    git checkout "$FEATURE_BRANCH"
else
    echo "Creating new branch: $FEATURE_BRANCH"
    git checkout -b "$FEATURE_BRANCH"
fi

echo ""
echo "Launching planning agent..."
echo "The agent will read AGENTS.md and apply the Rule of 3 to decompose your work."
echo ""

# Launch claude - it reads AGENTS.md automatically
claude
