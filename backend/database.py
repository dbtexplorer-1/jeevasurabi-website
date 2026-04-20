from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Format: mysql+pymysql://<username>:<password>@<host>:<port>/<database_name>
# Note: MySQL default port is 3306. 
# Ensure you have created the 'ecommerce_js_db' database in your MySQL server.
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:CBInnovation%402025@localhost:3306/ecommerce_js_db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # pool_pre_ping helps maintain connections if the MySQL server has a timeout
    pool_pre_ping=True 
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()