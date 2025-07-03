#!/bin/bash

# HustleMode.ai - Automated Migration Creation Script
# Creates properly versioned and documented database migrations
# Usage: ./scripts/create-migration.sh "description_of_change" [major|minor|patch|hotfix]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIGRATIONS_DIR="supabase/migrations"
SCRIPTS_DIR="scripts"

# Function to display usage
usage() {
    echo "Usage: $0 \"description_of_change\" [version_type]"
    echo ""
    echo "Arguments:"
    echo "  description_of_change  : Brief description using underscores (e.g., 'add_user_settings')"
    echo "  version_type          : major|minor|patch|hotfix (default: minor)"
    echo ""
    echo "Examples:"
    echo "  $0 \"add_user_settings\" minor"
    echo "  $0 \"fix_phone_constraint\" hotfix"
    echo "  $0 \"remove_legacy_table\" major"
    echo ""
    echo "Version Types:"
    echo "  major   : Breaking changes (1.0.0 → 2.0.0)"
    echo "  minor   : New features, non-breaking (1.0.0 → 1.1.0)"
    echo "  patch   : Bug fixes, small changes (1.0.0 → 1.0.1)"
    echo "  hotfix  : Emergency fixes (1.0.0 → 1.0.1-hotfix)"
    exit 1
}

# Function to get current schema version
get_current_version() {
    # Look for version in existing migration files
    local latest_file=$(ls -1 ${MIGRATIONS_DIR}/*_v*.sql 2>/dev/null | tail -n 1)
    
    if [[ -n "$latest_file" ]]; then
        # Extract version from filename (e.g., 20241219_v1.0.0_baseline_schema.sql → 1.0.0)
        echo $(basename "$latest_file" | sed -n 's/.*_v\([0-9]\+\.[0-9]\+\.[0-9]\+\).*/\1/p')
    else
        echo "1.0.0"  # Default if no versioned migrations found
    fi
}

# Function to increment version
increment_version() {
    local version=$1
    local type=$2
    
    IFS='.' read -ra PARTS <<< "$version"
    local major=${PARTS[0]}
    local minor=${PARTS[1]}
    local patch=${PARTS[2]}
    
    case $type in
        "major")
            echo "$((major + 1)).0.0"
            ;;
        "minor")
            echo "${major}.$((minor + 1)).0"
            ;;
        "patch"|"hotfix")
            echo "${major}.${minor}.$((patch + 1))"
            ;;
        *)
            echo "❌ Invalid version type: $type"
            exit 1
            ;;
    esac
}

# Function to validate description
validate_description() {
    local desc=$1
    
    # Check if description is provided
    if [[ -z "$desc" ]]; then
        echo -e "${RED}❌ Error: Description is required${NC}"
        usage
    fi
    
    # Check for valid characters (letters, numbers, underscores)
    if [[ ! "$desc" =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo -e "${RED}❌ Error: Description must contain only letters, numbers, and underscores${NC}"
        echo -e "${YELLOW}   Example: 'add_user_settings' not 'add user settings!'${NC}"
        exit 1
    fi
    
    # Check length
    if [[ ${#desc} -gt 50 ]]; then
        echo -e "${RED}❌ Error: Description must be 50 characters or less${NC}"
        exit 1
    fi
}

# Function to create migration template
create_migration_template() {
    local filename=$1
    local version=$2
    local description=$3
    local migration_type=$4
    
    # Convert underscores to spaces for readable description
    local readable_desc=$(echo "$description" | tr '_' ' ')
    
    cat > "$filename" << EOF
-- HustleMode.ai Database Migration v${version}
-- Migration: $(date +%Y-%m-%d)
-- Version: ${version}
-- Type: ${migration_type^^} - ${readable_desc}
-- Author: $(git config user.name 2>/dev/null || echo "Developer")

/*
============================================================================
MIGRATION: ${readable_desc}
============================================================================

DESCRIPTION:
Add detailed description of what this migration does and why it's needed.

CHANGES:
- [ ] Describe each change made
- [ ] Include any data transformations
- [ ] Note any breaking changes

ROLLBACK NOTES:
Describe how to rollback this migration if needed.

TESTING:
- [ ] Test on local database
- [ ] Verify with health check
- [ ] Test Edge Functions still work
- [ ] Validate user flows

============================================================================
*/

-- Record this migration in schema_versions
INSERT INTO schema_versions (version, migration_file, description, migration_type, rollback_notes) VALUES 
('${version}', '$(basename "$filename")', '${readable_desc}', '${migration_type}', 'Add rollback instructions here');

-- BEGIN MIGRATION CHANGES
-- ======================

-- TODO: Add your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field TEXT;
-- CREATE INDEX idx_new_field ON users(new_field);

-- END MIGRATION CHANGES
-- ====================

/*
============================================================================
MIGRATION COMPLETE - v${version}
============================================================================
Expected Schema Version: ${version}
Migration Type: ${migration_type^^}
Changes: TODO - Document changes made
Next Steps: 
1. Test migration locally: supabase db reset
2. Deploy to production: supabase db push
3. Verify with health check: curl /health endpoint
============================================================================
*/
EOF
}

# Main script logic
main() {
    echo -e "${BLUE}🚀 HustleMode.ai Migration Creator${NC}"
    echo -e "${BLUE}=================================${NC}"
    
    # Parse arguments
    local description="$1"
    local version_type="${2:-minor}"
    
    # Validate inputs
    validate_description "$description"
    
    # Get current version and increment
    local current_version=$(get_current_version)
    local new_version=$(increment_version "$current_version" "$version_type")
    
    echo -e "${YELLOW}📋 Migration Details:${NC}"
    echo -e "   Current Version: ${current_version}"
    echo -e "   New Version:     ${new_version}"
    echo -e "   Type:           ${version_type}"
    echo -e "   Description:    ${description}"
    echo ""
    
    # Create filename with timestamp and version
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="${MIGRATIONS_DIR}/${timestamp}_v${new_version}_${description}.sql"
    
    # Check if migrations directory exists
    if [[ ! -d "$MIGRATIONS_DIR" ]]; then
        echo -e "${RED}❌ Error: Migrations directory not found: $MIGRATIONS_DIR${NC}"
        echo -e "${YELLOW}   Are you running this from the project root?${NC}"
        exit 1
    fi
    
    # Create migration file
    echo -e "${YELLOW}📝 Creating migration file...${NC}"
    create_migration_template "$filename" "$new_version" "$description" "$version_type"
    
    # Success message
    echo -e "${GREEN}✅ Migration created successfully!${NC}"
    echo -e "${GREEN}   File: $filename${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "   1. Edit the migration file: ${filename}"
    echo -e "   2. Add your SQL changes in the marked section"
    echo -e "   3. Test locally: ${YELLOW}supabase db reset${NC}"
    echo -e "   4. Deploy: ${YELLOW}supabase db push${NC}"
    echo -e "   5. Verify: ${YELLOW}curl https://your-project.supabase.co/functions/v1/health${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to:${NC}"
    echo -e "   - Update rollback instructions"
    echo -e "   - Test thoroughly before deployment"
    echo -e "   - Document all changes"
    
    # Open file in editor if available
    if command -v code &> /dev/null; then
        echo ""
        echo -e "${BLUE}🎯 Opening migration file in VS Code...${NC}"
        code "$filename"
    fi
}

# Check if help requested
if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
fi

# Run main function
main "$@" 