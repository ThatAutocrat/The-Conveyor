from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
    class Config: from_attributes = True

# --- Repos ---
class RepoAdd(BaseModel):
    github_full_name: str  # "owner/repo"

class RepoOut(BaseModel):
    id: int
    github_full_name: str
    description: Optional[str]
    default_branch: str
    is_active: bool
    added_at: datetime
    class Config: from_attributes = True

# --- Pipelines ---
class PipelineOut(BaseModel):
    id: int
    repo_id: int
    github_run_id: int
    name: str
    head_branch: str
    head_sha: str
    head_commit_message: Optional[str]
    head_commit_author: Optional[str]
    status: str
    conclusion: Optional[str]
    event: Optional[str]
    run_number: Optional[int]
    duration_seconds: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True

class PipelineWithRepo(PipelineOut):
    repo_full_name: str

# --- GitHub token ---
class GitHubTokenSet(BaseModel):
    token: str

# --- Dashboard stats ---
class DashboardStats(BaseModel):
    total_runs: int
    success_rate: float
    avg_duration_seconds: Optional[float]
    failing_repos: int
