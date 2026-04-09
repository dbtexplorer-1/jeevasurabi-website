# backend/seed.py
from database import SessionLocal, engine
import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

# Your initial product data
all_products = [
    { "id": 1, "name": "Cold Pressed Coconut oil", "category": "Cold Pressed Oils", "size": "1 Litre", "price": 500, "img": "/coconut.png", "description": "Extracted from premium quality coconuts using traditional wooden ghanis. Free from chemical processing, our coconut oil retains all natural nutrients, aroma, and flavor.", "stock_quantity": 100 },
    { "id": 2, "name": "Cold Pressed Coconut oil", "category": "Cold Pressed Oils", "size": "500 ml", "price": 250, "img": "/coconut.png", "description": None, "stock_quantity": 80 },
    { "id": 3, "name": "Cold Pressed Gingelly oil", "category": "Cold Pressed Oils", "size": "1 Litre", "price": 480, "img": "/gingelly.png", "description": "Made from carefully selected sesame seeds and palm jaggery. Cold-pressed to perfection, maintaining the authentic traditional taste and nutritional benefits.", "stock_quantity": 60 },
    { "id": 4, "name": "Cold Pressed Gingelly oil", "category": "Cold Pressed Oils", "size": "500 ml", "price": 240, "img": "/gingelly.png", "description": None, "stock_quantity": 40 },
    { "id": 5, "name": "Cold Pressed Groundnut oil", "category": "Cold Pressed Oils", "size": "1 Litre", "price": 320, "img": "/groundnut.png", "description": "Pure, unrefined groundnut oil pressed in a traditional Mara Chekku. Perfect for deep frying and everyday cooking, giving your food a rich, authentic flavor.", "stock_quantity": 120 },
    { "id": 6, "name": "Cold Pressed Groundnut oil", "category": "Cold Pressed Oils", "size": "500 ml", "price": 160, "img": "/groundnut.png", "description": None, "stock_quantity": 90 },
    { "id": 7, "name": "Hand Made Soap", "category": "Cosmetics", "size": "100g", "price": 50, "img": "/handmade-soap.jpg", "description": None, "stock_quantity": 200 },
    { "id": 8, "name": "Ghee", "category": "Ghee & Natural Sweeteners", "size": "500 ml", "price": 420, "img": "/jeevasurabi-ghee.jpg", "description": "A2 Desi Cow Ghee made using the traditional Bilona method. Cultured from A2 milk curd, slowly churned to extract makkhan, and gently heated to create golden, aromatic ghee.", "stock_quantity": 50 },
    { "id": 9, "name": "Ghee", "category": "Ghee & Natural Sweeteners", "size": "200 ml", "price": 180, "img": "/jeevasurabi-ghee.jpg", "description": None, "stock_quantity": 50 },
    { "id": 10, "name": "Honey", "category": "Ghee & Natural Sweeteners", "size": "1kg bottle", "price": 440, "img": "/honey-jeevasurabi-food-products.jpg", "description": "100% pure, raw, and unfiltered honey sourced directly from deep forest bee keepers. Rich in antioxidants and natural enzymes.", "stock_quantity": 30 },
    { "id": 11, "name": "Honey", "category": "Ghee & Natural Sweeteners", "size": "500g", "price": 230, "img": "/honey-jeevasurabi-food-products.jpg", "description": None, "stock_quantity": 45 },
    { "id": 12, "name": "Honey", "category": "Ghee & Natural Sweeteners", "size": "250g", "price": 120, "img": "/honey-jeevasurabi-food-products.jpg", "description": None, "stock_quantity": 60 },
    { "id": 13, "name": "Karupatti Palm Jaggery", "category": "Ghee & Natural Sweeteners", "size": "500 grams", "price": 190, "img": "/karuppatti-jeevasurabi-food-products.jpg", "description": None, "stock_quantity": 100 },
    { "id": 14, "name": "Naatusarkarai", "category": "Ghee & Natural Sweeteners", "size": "500 grams", "price": 50, "img": "/naatusarkarai-jeevasurabi-food-products.jpg", "description": None, "stock_quantity": 150 },
    { "id": 15, "name": "Panangarkandu Palm Sugar 1st grade", "category": "Ghee & Natural Sweeteners", "size": "200 grams", "price": 160, "img": "/panangarkandu.jpg", "description": None, "stock_quantity": 40 },
    { "id": 16, "name": "Panangarkandu Palm Sugar 2nd grade", "category": "Ghee & Natural Sweeteners", "size": "200 grams", "price": 120, "img": "/panangarkandu.jpg", "description": None, "stock_quantity": 80 },
    { "id": 17, "name": "Biozen", "category": "Health Supplement", "size": "400 ml", "price": 650, "img": "/biozen.jpg", "description": None, "stock_quantity": 25 },
    { "id": 18, "name": "Health Mix", "category": "Health Supplement", "size": "250 grams", "price": 120, "img": "/healthmix.jpg", "description": None, "stock_quantity": 100 },
    { "id": 19, "name": "Rock salt", "category": "Others", "size": "500 grams", "price": 50, "img": "/rock-salt.jpg", "description": None, "stock_quantity": 300 }
]

def seed_database():
    db = SessionLocal()
    try:
        # Check if products already exist so we don't duplicate
        existing_count = db.query(models.ProductDB).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} products. Skipping seed.")
            return

        print("Seeding database with JeevaSurabi products...")
        for item in all_products:
            db_product = models.ProductDB(
                id=item["id"],
                name=item["name"],
                category=item["category"],
                size=item["size"],
                price=item["price"],
                img=item["img"],
                description=item["description"],
                stock_quantity=item["stock_quantity"]
            )
            db.add(db_product)
        
        db.commit()
        print("Successfully added all 19 products to the database! 🎉")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()