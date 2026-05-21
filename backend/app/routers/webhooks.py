from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.repo import Repo
from app.models.pipeline import Pipeline
from app.services.github import parse_run
from app.services.ws_manager import manager
import json

router = APIRouter()

@router.post("/github")
async def github_webhook(request: Request):
    event = request.headers.get("X-GitHub-Event", "")
    payload = await request.json()

    if event != "workflow_run":
        return {"ignored": True}

    run = payload.get("workflow_run", {})
    repo_full_name = payload.get("repository", {}).get("full_name", "")

    db: Session = SessionLocal()
    try:
        repo = db.query(Repo).filter(Repo.github_full_name == repo_full_name).first()
        if not repo:
            return {"ignored": True, "reason": "repo not tracked"}

        existing = db.query(Pipeline).filter(Pipeline.github_run_id == run["id"]).first()
        if existing:
            existing.status = run.get("status", existing.status)
            existing.conclusion = run.get("conclusion", existing.conclusion)
            db.commit()
            pipeline_data = {
                "id": existing.id,
                "github_run_id": existing.github_run_id,
                "name": existing.name,
                "status": existing.status,
                "conclusion": existing.conclusion,
                "repo_id": existing.repo_id,
            }
        else:
            parsed = parse_run(run, repo.id)
            pipeline = Pipeline(**parsed)
            db.add(pipeline)
            db.commit()
            db.refresh(pipeline)
            pipeline_data = {
                "id": pipeline.id,
                "github_run_id": pipeline.github_run_id,
                "name": pipeline.name,
                "status": pipeline.status,
                "conclusion": pipeline.conclusion,
                "repo_id": pipeline.repo_id,
            }

        # Push real-time update to owner
        await manager.send_to_user(repo.owner_id, {
            "type": "pipeline_update",
            "data": pipeline_data,
        })

    finally:
        db.close()

    return {"received": True}
