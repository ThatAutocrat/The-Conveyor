from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    github_token = Column(String, nullable=True)  # stored for GitHub API calls
    created_at = Column(DateTime, default=datetime.utcnow)

    repos = relationship("Repo", back_populates="owner")
