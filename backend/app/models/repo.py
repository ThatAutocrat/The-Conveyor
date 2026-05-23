from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Repo(Base):
    __tablename__ = "repos"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    github_full_name = Column(String, nullable=False)  # e.g. "octocat/Hello-World"
    github_repo_id = Column(BigInteger, nullable=False)
    description = Column(String, nullable=True)
    default_branch = Column(String, default="main")
    is_active = Column(Boolean, default=True)
    webhook_id = Column(Integer, nullable=True)  # GitHub webhook ID
    added_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="repos")
    pipelines = relationship("Pipeline", back_populates="repo", cascade="all, delete-orphan")
