#!/bin/bash
# Start Worker - Launch a worker agent in a dedicated worktree
#
# Usage: ./scripts/start-worker.sh <feature-branch> <worker-number>
# Example: ./scripts/start-worker.sh awl-4000 1
#
# Creates a worktree at .worktrees/<feature-branch>-w<N> on branch <feature-branch>-w<N>
# Then launches claude which reads AGENTS.md for worker instructions

set -e

FEATURE_BRANCH="$1"
WORKER_NUM="$2"

if [ -z "$FEATURE_BRANCH" ] || [ -z "$WORKER_NUM" ]; then
    echo "Usage: $0 <feature-branch> <worker-number>"
    echo "Example: $0 awl-4000 1"
    exit 1
fi

WORKER_BRANCH="${FEATURE_BRANCH}-w${WORKER_NUM}"
WORKTREE_PATH=".worktrees/${WORKER_BRANCH}"

echo "=== Starting Worker $WORKER_NUM ==="
echo "Feature branch: $FEATURE_BRANCH"
echo "Worker branch: $WORKER_BRANCH"
echo "Worktree path: $WORKTREE_PATH"
echo ""

# Create worktrees directory if needed
mkdir -p .worktrees

# Create worktree if it doesn't exist
if [ ! -d "$WORKTREE_PATH" ]; then
    echo "Creating worktree..."
    bd worktree create "$WORKTREE_PATH" --branch "$WORKER_BRANCH" "$FEATURE_BRANCH"
    echo ""
fi

cd "$WORKTREE_PATH"

echo "Launching worker agent in $WORKTREE_PATH..."
echo "The agent will read AGENTS.md and pick up work with bd ready."
echo ""

# Launch claude - it reads AGENTS.md automatically
claude
