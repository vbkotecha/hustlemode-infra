#!/bin/bash

# HustleMode.ai Quality Enforcement Setup Script
# Sets up automated code quality enforcement system
# Usage: ./scripts/setup-quality-enforcement.sh

set -e

echo "🚀 Setting up HustleMode.ai Quality Enforcement System"
echo "====================================================="
echo ""

# 1. Configure Git hooks
echo "🔧 Configuring Git hooks..."
git config core.hooksPath .githooks
echo "✅ Git hooks configured to use .githooks directory"

# 2. Install pre-commit hook
if [[ -f ".githooks/pre-commit" ]]; then
    chmod +x .githooks/pre-commit
    echo "✅ Pre-commit hook installed and executable"
else
    echo "❌ Pre-commit hook not found"
    exit 1
fi

# 3. Test quality check script
echo ""
echo "🧪 Testing quality check script..."
if ./scripts/code-quality-check.sh; then
    echo "✅ Quality check script working correctly"
else
    echo "⚠️  Quality check found issues - fix before proceeding"
fi

# 4. Update deployment scripts to include quality checks
echo ""
echo "🔗 Integrating quality checks into deployment scripts..."

# Update deploy-migrations.sh to include quality checks
if grep -q "code-quality-check" scripts/deploy-migrations.sh; then
    echo "✅ Deployment script already includes quality checks"
else
    echo "⚠️  Consider updating deployment script to include quality checks"
fi

# 5. Create daily quality monitoring cron job suggestion
echo ""
echo "📊 Setting up monitoring recommendations..."
cat << 'EOF' > scripts/daily-quality-report.sh
#!/bin/bash
# Daily Quality Monitoring Report
# Add this to cron: 0 9 * * * /path/to/hustlemode-infra/scripts/daily-quality-report.sh

cd "$(dirname "$0")/.."
echo "📊 Daily Code Quality Report - $(date)"
echo "=================================="
./scripts/code-quality-check.sh --strict || echo "Quality issues detected!"
echo ""
echo "📈 File count by size:"
find supabase -name "*.ts" -exec wc -l {} \; | sort -nr | head -10
EOF

chmod +x scripts/daily-quality-report.sh
echo "✅ Daily quality report script created"

# 6. Setup VS Code/Cursor integration
echo ""
echo "⚙️  Setting up editor integration..."
mkdir -p .vscode
cat << 'EOF' > .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Quality Check",
            "type": "shell",
            "command": "./scripts/code-quality-check.sh",
            "group": {
                "kind": "test",
                "isDefault": true
            },
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        },
        {
            "label": "Quality Check (Strict)",
            "type": "shell", 
            "command": "./scripts/code-quality-check.sh --strict",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        }
    ]
}
EOF
echo "✅ VS Code tasks configured"

# 7. Setup package.json scripts if it exists
if [[ -f "package.json" ]]; then
    echo "⚠️  Consider adding quality check scripts to package.json:"
    echo '  "scripts": {'
    echo '    "quality:check": "./scripts/code-quality-check.sh",'
    echo '    "quality:strict": "./scripts/code-quality-check.sh --strict",'
    echo '    "precommit": "./scripts/code-quality-check.sh"'
    echo '  }'
fi

echo ""
echo "🎉 Quality Enforcement System Setup Complete!"
echo ""
echo "📋 What's been configured:"
echo "  ✅ Pre-commit hooks (blocks bad commits)"
echo "  ✅ Quality check script (./scripts/code-quality-check.sh)"
echo "  ✅ Daily monitoring script (./scripts/daily-quality-report.sh)"
echo "  ✅ VS Code task integration"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: ./scripts/code-quality-check.sh (to test)"
echo "  2. Try committing (quality checks will run automatically)"
echo "  3. Add daily monitoring to cron if desired"
echo ""
echo "⚠️  Important: Quality checks will now BLOCK commits with violations!"
echo "   Use 'git commit --no-verify' to bypass temporarily (not recommended)" 