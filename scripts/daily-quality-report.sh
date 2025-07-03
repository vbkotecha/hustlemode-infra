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
