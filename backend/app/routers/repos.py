from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.repo import Repo
from app.models.pipeline import Pipeline
from app.schemas.schemas import RepoAdd, RepoOut
from app.services import github
import asyncio

router = APIRouter()

@router.get("", response_model=list[RepoOut])
def list_repos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Repo).filter(Repo.owner_id == current_user.id, Repo.is_active == True).all()

@router.post("", response_model=RepoOut)
async def add_repo(data: RepoAdd, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.github_token:
        raise HTTPException(status_code=400, detail="GitHub token not set. Go to Settings.")

    existing = db.query(Repo).filter(Repo.github_full_name == data.github_full_name, Repo.owner_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Repo already added")

    repo_info = await github.get_repo_info(current_user.github_token, data.github_full_name)
    if not repo_info:
        raise HTTPException(status_code=404, detail="Repo not found or no access")

    repo = Repo(
        owner_id=current_user.id,
        github_full_name=data.github_full_name,
        github_repo_id=repo_info["id"],
        description=repo_info.get("description"),
        default_branch=repo_info.get("default_branch", "main"),
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    # Sync recent runs in background
    asyncio.create_task(_sync_runs(current_user.github_token, repo.id, data.github_full_name, db))

    return repo

@router.delete("/{repo_id}")
def remove_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    repo.is_active = False
    db.commit()
    return {"message": "Repo removed"}

@router.post("/{repo_id}/sync")
async def sync_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.owner_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    if not current_user.github_token:
        raise HTTPException(status_code=400, detail="GitHub token not set")

    runs = await github.get_workflow_runs(current_user.github_token, repo.github_full_name, per_page=50)
    count = 0
    for run in runs:
        existing = db.query(Pipeline).filter(Pipeline.github_run_id == run["id"]).first()
        if not existing:
            parsed = github.parse_run(run, repo.id)
            pipeline = Pipeline(**parsed)
            db.add(pipeline)
            count += 1
        else:
            existing.status = run.get("status", existing.status)
            existing.conclusion = run.get("conclusion", existing.conclusion)
    db.commit()
    return {"synced": count}

async def _sync_runs(token: str, repo_id: int, full_name: str, db: Session):
    try:
        runs = await github.get_workflow_runs(token, full_name, per_page=30)
        for run in runs:
            existing = db.query(Pipeline).filter(Pipeline.github_run_id == run["id"]).first()
            if not existing:
                parsed = github.parse_run(run, repo_id)
                pipeline = Pipeline(**parsed)
                db.add(pipeline)
        db.commit()
    except Exception:
        pass
