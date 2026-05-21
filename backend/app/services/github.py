import httpx
from typing import Optional
from datetime import datetime

GITHUB_API = "https://api.github.com"

def github_headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

async def get_repo_info(token: str, full_name: str) -> Optional[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{GITHUB_API}/repos/{full_name}", headers=github_headers(token))
        if r.status_code != 200:
            return None
        return r.json()

async def get_workflow_runs(token: str, full_name: str, per_page: int = 30) -> list[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{full_name}/actions/runs",
            headers=github_headers(token),
            params={"per_page": per_page}
        )
        if r.status_code != 200:
            return []
        return r.json().get("workflow_runs", [])

async def get_run_jobs(token: str, full_name: str, run_id: int) -> list[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GITHUB_API}/repos/{full_name}/actions/runs/{run_id}/jobs",
            headers=github_headers(token),
        )
        if r.status_code != 200:
            return []
        return r.json().get("jobs", [])

async def create_webhook(token: str, full_name: str, callback_url: str) -> Optional[int]:
    payload = {
        "name": "web",
        "active": True,
        "events": ["workflow_run"],
        "config": {
            "url": callback_url,
            "content_type": "json",
        }
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{GITHUB_API}/repos/{full_name}/hooks",
            headers=github_headers(token),
            json=payload,
        )
        if r.status_code == 201:
            return r.json().get("id")
        return None

async def delete_webhook(token: str, full_name: str, hook_id: int):
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{GITHUB_API}/repos/{full_name}/hooks/{hook_id}",
            headers=github_headers(token),
        )

def parse_run(run: dict, repo_id: int) -> dict:
    started = run.get("run_started_at") or run.get("created_at")
    completed = run.get("updated_at") if run.get("status") == "completed" else None

    duration = None
    if started and completed:
        try:
            fmt = "%Y-%m-%dT%H:%M:%SZ"
            s = datetime.strptime(started, fmt)
            c = datetime.strptime(completed, fmt)
            duration = (c - s).total_seconds()
        except Exception:
            pass

    commit = run.get("head_commit") or {}
    return {
        "repo_id": repo_id,
        "github_run_id": run["id"],
        "name": run.get("name", ""),
        "head_branch": run.get("head_branch", ""),
        "head_sha": run.get("head_sha", ""),
        "head_commit_message": commit.get("message", ""),
        "head_commit_author": commit.get("author", {}).get("name", ""),
        "status": run.get("status", "queued"),
        "conclusion": run.get("conclusion"),
        "event": run.get("event"),
        "run_number": run.get("run_number"),
        "duration_seconds": duration,
        "started_at": started,
        "completed_at": completed,
    }
