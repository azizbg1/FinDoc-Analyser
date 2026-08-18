#!/bin/bash
# Download the French spaCy model inside the backend container.
# Run once after the first build.

set -e
echo "Downloading spaCy French model..."
docker exec findoc_backend python -m spacy download fr_core_news_md
echo "Done."
