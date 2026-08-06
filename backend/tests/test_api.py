import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite:///./jeevasurabi_test.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

import auth
import models
from database import Base, SessionLocal, engine
from main import app


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_user(*, is_admin=False):
    db = SessionLocal()
    user = models.UserDB(
        full_name="Test User",
        email="test@example.com",
        phone_number="9999999999",
        hashed_password=auth.get_password_hash("Password123"),
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def create_product(stock_quantity=5):
    db = SessionLocal()
    product = models.ProductDB(
        name="Test Oil",
        category="Cold Pressed Oils",
        size="1 Litre",
        price=200,
        img="/oil.png",
        stock_quantity=stock_quantity,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    db.close()
    return product


def authorization_header(user):
    token = auth.create_access_token({"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


def test_me_returns_the_authenticated_profile(client):
    user = create_user()

    response = client.get("/me", headers=authorization_header(user))

    assert response.status_code == 200
    assert response.json()["id"] == user.id
    assert response.json()["email"] == user.email


def test_order_reduces_stock_and_cancellation_restores_it(client):
    user = create_user()
    product = create_product(stock_quantity=5)
    headers = authorization_header(user)

    order_response = client.post(
        "/orders",
        headers=headers,
        json={"shipping_address": "Nagercoil", "items": [{"product_id": product.id, "quantity": 2}]},
    )

    assert order_response.status_code == 200
    assert order_response.json()["total_amount"] == 400
    assert SessionLocal().get(models.ProductDB, product.id).stock_quantity == 3

    cancel_response = client.put(f"/orders/{order_response.json()['id']}/cancel", headers=headers)

    assert cancel_response.status_code == 200
    assert SessionLocal().get(models.ProductDB, product.id).stock_quantity == 5


def test_order_rejects_an_out_of_stock_product(client):
    user = create_user()
    product = create_product(stock_quantity=0)

    response = client.post(
        "/orders",
        headers=authorization_header(user),
        json={"shipping_address": "Nagercoil", "items": [{"product_id": product.id, "quantity": 1}]},
    )

    assert response.status_code == 400
    assert "Not enough stock" in response.json()["detail"]


def test_expired_signup_otp_is_rejected(client):
    db = SessionLocal()
    db.add(models.OTPVerificationDB(
        phone_number="8888888888",
        otp_code="123456",
        expires_at=datetime.utcnow() - timedelta(minutes=1),
    ))
    db.commit()
    db.close()

    response = client.post("/verify-otp-and-signup", json={
        "phone_number": "8888888888",
        "otp_code": "123456",
        "full_name": "Expired OTP User",
        "password": "Password123",
    })

    assert response.status_code == 400
    assert response.json()["detail"] == "OTP expired"


def test_non_admin_cannot_access_admin_orders(client):
    user = create_user(is_admin=False)

    response = client.get("/admin/orders", headers=authorization_header(user))

    assert response.status_code == 403
