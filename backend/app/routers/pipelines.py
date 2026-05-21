from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.repo import Repo
from app.models.pipeline import Pipeline
from app.schemas.schemas import PipelineOut, DashboardStats

router = APIRouter()

@router.get("", response_model=list[PipelineOut])
def list_pipelines(
    repo_id: Optional[int] = None,
    branch: Optional[str] = None,
    status: Optional[str] = None,
    conclusion: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only show pipelines for repos owned by current user
    user_repo_ids = [r.id for r in db.query(Repo).filter(Repo.owner_id == current_user.id).all()]
    q = db.query(Pipeline).filter(Pipeline.repo_id.in_(user_repo_ids))

    if repo_id:
        q = q.filter(Pipeline.repo_id == repo_id)
    if branch:
        q = q.filter(Pipeline.head_branch == branch)
    if status:
        q = q.filter(Pipeline.status == status)
    if conclusion:
        q = q.filter(Pipeline.conclusion == conclusion)

    return q.order_by(Pipeline.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_repo_ids = [r.id for r in db.query(Repo).filter(Repo.owner_id == current_user.id).all()]

    total = db.query(Pipeline).filter(Pipeline.repo_id.in_(user_repo_ids)).count()

    completed = db.query(Pipeline).filter(
        Pipeline.repo_id.in_(user_repo_ids),
        Pipeline.status == "completed"
    ).all()

    success = sum(1 for p in completed if p.conclusion == "success")
    success_rate = (success / len(completed) * 100) if completed else 0

    durations = [p.duration_seconds for p in completed if p.duration_seconds]
    avg_duration = sum(durations) / len(durations) if durations else None

    # repos with latest run = failure
    failing = 0
    for repo_id in user_repo_ids:
        latest = db.query(Pipeline).filter(
            Pipeline.repo_id == repo_id,
            Pipeline.status == "completed"
        ).order_by(Pipeline.created_at.desc()).first()
        if latest and latest.conclusion == "failure":
            failing += 1

    return DashboardStats(
        total_runs=total,
        success_rate=round(success_rate, 1),
        avg_duration_seconds=avg_duration,
        failing_repos=failing,
    )

@router.get("/{pipeline_id}", response_model=PipelineOut)
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_repo_ids = [r.id for r in db.query(Repo).filter(Repo.owner_id == current_user.id).all()]
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.repo_id.in_(user_repo_ids)).first()
    if not pipeline:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return pipeline
