#!/usr/bin/env python3
"""Capture HF-bot receipt scans as deterministic Budget Boss test fixtures.

This runs the *actual* TeacherBOY (Hugging Face Space `EvilEvan/TeacherBOY`)
receipt path over the scraped image corpus:

  receipt image
    -> vision stage: text extraction using TeacherBOY's own
       `RECEIPT_SCRAPE_PROMPT` (imported, never re-typed)
    -> TeacherBOY `gemini_text_to_ocr_payload()` (imported, never
       re-implemented) -> OcrPayload
    -> written to tests/fixtures/receipts/hf-bot/<id>.json

Vision stages (`--vision`)
  gemini   Live Gemini 2.5 Flash call with the bot's exact prompt, temperature
           and max-tokens. Requires GEMINI_API_KEY and available quota.
  dataset  No model call: uses the human-verified OCR transcription that ships
           with the source dataset row. Same bytes the vision stage would be
           asked to read, so the adapter + Budget Boss scraper are exercised
           identically, without burning paid credits.
  auto     Try gemini, fall back to dataset on quota/HTTP errors (default).

The vision stage actually used is recorded in each fixture's
`capture.visionStage`, so a fixture never overstates its own provenance.
Committed fixtures are captured output, keeping the test suite deterministic,
offline and free of paid API calls.

Prerequisites
  TEACHERBOY_DIR   path to the TeacherBOY checkout
                   (default: /home/ewaldt/Documents/VS/Other/Bot/TeacherBOY)
  GEMINI_API_KEY   only for --vision gemini/auto; e.g.
                   export GEMINI_API_KEY=$(npx convex env get GEMINI_API_KEY)

Usage
  python3 scripts/capture_hf_bot_receipts.py [--vision auto|gemini|dataset]
                                             [--only cord-000] [--limit N]
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CORPUS_DIR = REPO_ROOT / "tests" / "fixtures" / "receipts" / ".corpus"
OUT_DIR = REPO_ROOT / "tests" / "fixtures" / "receipts" / "hf-bot"

HF_SPACE = "EvilEvan/TeacherBOY"
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
# Mirrors ReceiptAgent.handle()'s vision call.
TEMPERATURE = 0.1
MAX_OUTPUT_TOKENS = 2000
# Pin capturedAt so re-captures don't churn the fixtures. 2026-01-01T00:00:00Z.
PINNED_CAPTURED_AT = 1_767_225_600_000

COUNTRY_HINTS = {"cord": "ID", "invoice": "US"}


def load_bot_modules(teacherboy_dir: Path):
    """Import the deployed bot's prompt + payload adapter (no re-implementation)."""
    if not (teacherboy_dir / "src" / "agents" / "receipt_agent.py").exists():
        raise SystemExit(
            f"TeacherBOY checkout not found at {teacherboy_dir}; set TEACHERBOY_DIR"
        )
    sys.path.insert(0, str(teacherboy_dir))
    from src.agents.receipt_agent import RECEIPT_SCRAPE_PROMPT  # noqa: PLC0415
    from src.services.receipt_bridge import (  # noqa: PLC0415
        gemini_text_to_ocr_payload,
    )

    return RECEIPT_SCRAPE_PROMPT, gemini_text_to_ocr_payload


def space_revision() -> str | None:
    """Record which deployed Space revision the bot code corresponds to."""
    try:
        with urllib.request.urlopen(
            f"https://huggingface.co/api/spaces/{HF_SPACE}", timeout=15
        ) as resp:
            return json.load(resp).get("sha")
    except Exception:  # network optional — provenance is best-effort
        return None


def gemini_vision_text(api_key: str, prompt: str, image_bytes: bytes) -> str:
    """Call Gemini vision exactly as the bot's fallback dispatcher does."""
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64.b64encode(image_bytes).decode(),
                        }
                    },
                ],
            }
        ],
        "generationConfig": {
            "temperature": TEMPERATURE,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        },
    }
    req = urllib.request.Request(
        f"{GEMINI_URL}?key={api_key}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts if p.get("text"))


def extract_text(entry, mode, api_key, prompt):
    """Return (text, vision_stage_descriptor) for one corpus entry."""
    dataset_stage = {
        "kind": "dataset-transcription",
        "detail": (
            "Human-verified OCR transcription shipped with the source dataset "
            "row; substituted for a live model call so fixtures stay free and "
            "deterministic. The bot prompt asks for exactly this: the receipt's "
            "raw text."
        ),
        "promptSha256": hashlib.sha256(prompt.encode()).hexdigest(),
        "model": None,
    }
    if mode == "dataset":
        return entry["ocrText"], dataset_stage

    image_bytes = (CORPUS_DIR / entry["file"]).read_bytes()
    try:
        text = gemini_vision_text(api_key, prompt, image_bytes)
        if not text.strip():
            raise RuntimeError("empty vision response")
        return text, {
            "kind": "live-vision",
            "detail": "Live Gemini vision call using the bot's prompt verbatim.",
            "promptSha256": hashlib.sha256(prompt.encode()).hexdigest(),
            "model": GEMINI_MODEL,
            "temperature": TEMPERATURE,
            "maxOutputTokens": MAX_OUTPUT_TOKENS,
        }
    except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError) as exc:
        if mode == "gemini":
            raise SystemExit(f"live vision failed for {entry['id']}: {exc}") from exc
        reason = getattr(exc, "code", None) or str(exc)
        print(f"   live vision unavailable ({reason}); using dataset transcription")
        return entry["ocrText"], dataset_stage


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--vision", choices=("auto", "gemini", "dataset"), default="auto"
    )
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    manifest_path = CORPUS_DIR / "manifest.json"
    if not manifest_path.exists():
        raise SystemExit(
            "No corpus found. Run: node scripts/scrape-receipt-corpus.mjs --limit 4"
        )
    manifest = json.loads(manifest_path.read_text())

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    mode = args.vision
    if mode in ("auto", "gemini") and not api_key:
        if mode == "gemini":
            raise SystemExit(
                "GEMINI_API_KEY is unset. "
                "export GEMINI_API_KEY=$(npx convex env get GEMINI_API_KEY)"
            )
        print("GEMINI_API_KEY unset — using dataset transcriptions")
        mode = "dataset"

    teacherboy_dir = Path(
        os.environ.get(
            "TEACHERBOY_DIR", "/home/ewaldt/Documents/VS/Other/Bot/TeacherBOY"
        )
    )
    prompt, to_payload = load_bot_modules(teacherboy_dir)
    revision = space_revision()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    entries = manifest["entries"]
    if args.only:
        entries = [e for e in entries if e["id"] in set(args.only)]
    if args.limit:
        entries = entries[: args.limit]

    written = 0
    for entry in entries:
        text, stage = extract_text(entry, mode, api_key, prompt)
        if not text.strip():
            print(f"!! {entry['id']}: no text available, skipping")
            continue

        country_hint = COUNTRY_HINTS.get(entry["id"].split("-")[0], "US")
        payload = to_payload(text, country_hint)
        payload["capturedAt"] = PINNED_CAPTURED_AT

        fixture = {
            "id": entry["id"],
            "capture": {
                "bot": f"huggingface.co/spaces/{HF_SPACE}",
                "botRevision": revision,
                "agent": "ReceiptAgent (priority 8)",
                "adapter": "src/services/receipt_bridge.gemini_text_to_ocr_payload",
                "visionStage": stage,
            },
            "image": {
                "sha256": entry["sha256"],
                "bytes": entry["bytes"],
                **entry["source"],
            },
            "datasetGroundTruth": entry["groundTruth"],
            "rawText": text,
            "payload": payload,
        }
        out_path = OUT_DIR / f"{entry['id']}.json"
        out_path.write_text(json.dumps(fixture, indent=2, ensure_ascii=False) + "\n")
        written += 1
        print(
            f"captured {out_path.relative_to(REPO_ROOT)} "
            f"({len(payload['lines'])} lines, {stage['kind']})"
        )

    print(f"\n{written} fixture(s) written to {OUT_DIR.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
