from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repos.id"), nullable=False)

    # GitHub Actions fields
    github_run_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)           # workflow name
    head_branch = Column(String, nullable=False)    # branch
    head_sha = Column(String, nullable=False)       # commit SHA
    head_commit_message = Column(String, nullable=True)
    head_commit_author = Column(String, nullable=True)

    # Status: queued | in_progress | completed
    status = Column(String, nullable=False, default="queued")
    # Conclusion: success | failure | cancelled | skipped | timed_out | null
    conclusion = Column(String, nullable=True)

    event = Column(String, nullable=True)           # push | pull_request | schedule
    run_number = Column(Integer, nullable=True)
    duration_seconds = Column(Float, nullable=True)

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    repo = relationship("Repo", back_populates="pipelines")
