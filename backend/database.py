from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Format: postgresql://<username>:<password>@<host>:<port>/<database_name>
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:CBInnovation%402025@localhost:5432/ecommerce_js_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()