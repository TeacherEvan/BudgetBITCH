#!/usr/bin/env python3
"""
Hugging Face Space Automated Deployment Script
Deploys International Receipt OCR Bot files to Hugging Face Spaces for user EvilEvan.
Usage:
    python scripts/deploy_to_hf.py --username EvilEvan --space receipt-ocr-bot [--token HF_TOKEN]
"""

import os
import argparse
import sys
from pathlib import Path


def deploy_space(username: str, space_name: str, token: str = None):
    try:
        from huggingface_hub import HfApi
    except ImportError:
        print("Error: huggingface_hub is not installed. Install via `pip install huggingface_hub`")
        sys.exit(1)

    repo_id = f"{username}/{space_name}"
    print(f"🚀 Preparing deployment to Hugging Face Space: {repo_id}...")

    auth_token = token or os.environ.get("HF_TOKEN")
    if not auth_token:
        print("⚠️ Warning: HF_TOKEN environment variable not set. Assuming public deployment or cached CLI login.")

    api = HfApi(token=auth_token)

    try:
        # Create Space if it doesn't exist
        api.create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="gradio",
            exist_ok=True,
            private=False
        )
        print(f"✅ Space repo {repo_id} verified/created.")
    except Exception as e:
        print(f"Note on repo check: {e}")

    # Files to upload to Hugging Face Space
    files_to_upload = [
        "app.py",
        "requirements.txt",
        "README.md",
        "pyproject.toml",
    ]

    root_dir = Path(__file__).parent.parent

    # Upload core package directory
    try:
        print(f"📦 Uploading `hf_bot` package and configuration files to {repo_id}...")
        api.upload_folder(
            folder_path=str(root_dir / "hf_bot"),
            path_in_repo="hf_bot",
            repo_id=repo_id,
            repo_type="space",
            token=auth_token
        )

        for filename in files_to_upload:
            file_path = root_dir / filename
            if file_path.exists():
                api.upload_file(
                    path_or_fileobj=str(file_path),
                    path_in_repo=filename,
                    repo_id=repo_id,
                    repo_type="space",
                    token=auth_token
                )
                print(f"   ✓ Uploaded {filename}")

        print(f"🎉 Deployment successfully initiated!")
        print(f"🔗 Access your live Hugging Face Space: https://huggingface.co/spaces/{repo_id}")

    except Exception as err:
        print(f"❌ Deployment error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Deploy Receipt OCR Bot to Hugging Face Spaces")
    parser.add_argument("--username", default="EvilEvan", help="Hugging Face username")
    parser.add_argument("--space", default="receipt-ocr-bot", help="Hugging Face Space name")
    parser.add_argument("--token", default=None, help="Hugging Face API token")
    args = parser.parse_args()

    deploy_space(username=args.username, space_name=args.space, token=args.token)
