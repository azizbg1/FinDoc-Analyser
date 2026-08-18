"""ChromaDB vector store service for the RAG pipeline.

Isolation strategy: one collection per document — `document_{document_id}`.
This guarantees that no chunk from document A can ever appear in a query
for document B, regardless of metadata filters.
"""
from __future__ import annotations

import chromadb
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

from backend.config import CHROMA_HOST, CHROMA_PORT, EMBEDDING_MODEL
from backend.utils.logger import get_logger

logger = get_logger(__name__)

_client: chromadb.HttpClient | None = None
_embedder: SentenceTransformer | None = None
_text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=64)


def _get_client() -> chromadb.HttpClient:
    global _client
    if _client is None:
        _client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        logger.info("ChromaDB client connected at %s:%s", CHROMA_HOST, CHROMA_PORT)
    return _client


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
        logger.info("Embedding model loaded: %s", EMBEDDING_MODEL)
    return _embedder


def _collection_name(document_id: int) -> str:
    """Each document gets its own isolated ChromaDB collection."""
    return f"document_{document_id}"


def _reset_document_collection(client: chromadb.HttpClient, document_id: int):
    """
    Delete the previous collection for *document_id* (if any) and create a fresh one.
    Called at the start of index_document to guarantee complete isolation on re-analysis.
    """
    name = _collection_name(document_id)
    try:
        client.delete_collection(name=name)
        logger.info("Deleted previous collection '%s'", name)
        print(f"[VectorStore] Deleted previous collection '{name}' — starting fresh")
    except Exception:
        pass  # Collection doesn't exist yet — that's fine
    collection = client.create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"[VectorStore] Created new collection '{name}'")
    return collection


def index_document(document_id: int, text: str) -> int:
    """
    Split *text* into chunks, embed them, and store in an ISOLATED collection
    named `document_{document_id}`.

    Always deletes the previous collection first — guarantees no stale data
    from a previous analysis of the same document.
    Returns the number of chunks indexed.
    """
    print(f"\n[VectorStore] === index_document ===")
    print(f"[VectorStore] document_id  = {document_id}")
    print(f"[VectorStore] collection   = {_collection_name(document_id)}")
    print(f"[VectorStore] text length  = {len(text)} chars")

    client = _get_client()
    embedder = _get_embedder()

    # Always recreate the collection — complete isolation on every analysis.
    collection = _reset_document_collection(client, document_id)

    chunks = _text_splitter.split_text(text)
    if not chunks:
        logger.warning("Document %d produced no chunks", document_id)
        return 0

    embeddings = embedder.encode(chunks, show_progress_bar=False).tolist()
    ids = [f"chunk_{i}" for i in range(len(chunks))]

    collection.upsert(ids=ids, embeddings=embeddings, documents=chunks)
    logger.info("Indexed %d chunks for document %d in collection '%s'",
                len(chunks), document_id, _collection_name(document_id))
    print(f"[VectorStore] Indexed {len(chunks)} chunks in '{_collection_name(document_id)}'")
    return len(chunks)


def query_document(document_id: int, question: str, n_results: int = 5) -> list[str]:
    """
    Retrieve the *n_results* most relevant chunks for *question* from the
    collection dedicated to *document_id*.

    No cross-document filtering needed — the collection is already isolated.
    Returns [] if the document has not been indexed yet.
    """
    print(f"\n[VectorStore] === query_document ===")
    print(f"[VectorStore] document_id = {document_id}")
    print(f"[VectorStore] collection  = {_collection_name(document_id)}")
    print(f"[VectorStore] question    = {question}")

    client = _get_client()
    embedder = _get_embedder()

    # Get the collection for this document — create empty one if not indexed yet.
    try:
        collection = client.get_collection(name=_collection_name(document_id))
    except Exception:
        logger.warning("Collection for document %d not found — returning empty results", document_id)
        print(f"[VectorStore] Collection '{_collection_name(document_id)}' not found — not indexed yet")
        return []

    count = collection.count()
    if count == 0:
        logger.info("Collection for document %d is empty", document_id)
        return []

    effective_n = min(n_results, count)
    question_embedding = embedder.encode([question], show_progress_bar=False).tolist()[0]

    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=effective_n,
    )

    documents: list[str] = results.get("documents", [[]])[0]
    logger.info(
        "RAG query for document %d returned %d chunks", document_id, len(documents)
    )
    print(f"[VectorStore] Returned {len(documents)} chunks for document {document_id}")
    return documents
