#!/bin/bash
# Pull the Llama 3 model after the Ollama container starts.
# Run once: docker exec findoc_ollama ollama pull llama3

set -e
echo "Pulling Llama 3 model via Ollama..."
docker exec findoc_ollama ollama pull llama3
echo "Done."
