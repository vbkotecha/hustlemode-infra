# Azure Search Schema Changelog

## [1.0.0] - 2024-03-19
### Added
- Initial schema creation for `hustlemode-index`
- Basic fields: id, content, category, timestamp, user_id
- Content suggester for improved search experience
- Scoring profile for recent content prioritization

### Schema Details
- Primary key: `id` (String)
- Searchable fields: content, category
- Filterable fields: category, timestamp, user_id
- Sortable fields: category, timestamp
- Facetable fields: category
- Default scoring profile: recent-content 