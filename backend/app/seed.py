# ไฟล์นี้มีฟังก์ชัน seed_database() ที่ main.py เรียกตอน startup
# ใส่ข้อมูลตัวอย่างเริ่มต้น (users, rooms, assets ฯลฯ) ให้ครั้งเดียวตอนฐานข้อมูลว่างเปล่า
# ถ้ามีข้อมูลอยู่แล้วจะข้ามไปเลย ไม่ทับข้อมูลเดิม

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import User, Room, Category, Brand, Asset, Transaction, MemberBorrowed, DamagedReport
from app.database import engine, Base, SessionLocal

def seed_database(db: Session):
    # Check if database already has users or assets (to avoid duplicate seeding)
    if db.query(User).first() is not None:
        print("[SEED] Database already has data. Skipping seed.")
        return

    print("[SEED] Starting database seeding...")
    
    # 1. Create Users
    users = [
        User(
            user_id="admin",
            email="admin@ubu.ac.th",
            first_name="System",
            last_name="Admin",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="admin",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        ),
        User(
            user_id="67114540088", # The user (Chaiyot Srisawang)
            email="67114540088@ubu.ac.th",
            first_name="Chaiyot",
            last_name="Srisawang",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="student",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        ),
        User(
            user_id="67114540033", # Partner 1 (Kaitip)
            email="67114540033@ubu.ac.th",
            first_name="Kaitip",
            last_name="Kritsanadecha",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="student",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        ),
        User(
            user_id="67114540314", # Partner 2 (Pannawit)
            email="67114540314@ubu.ac.th",
            first_name="Pannawit",
            last_name="Bunlopditkorn",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="student",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        ),
        User(
            user_id="67114540199",
            email="67114540199@ubu.ac.th",
            first_name="Kittipong",
            last_name="Wongsa",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="student",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        ),
        User(
            user_id="67114540256",
            email="67114540256@ubu.ac.th",
            first_name="Napat",
            last_name="Chaiyasit",
            profile_image="https://lh3.googleusercontent.com/a/default-user",
            role="student",
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Create Rooms
    rooms = [
        Room(room_name="sc251"),
        Room(room_name="sc252"),
        Room(room_name="sc253"),
        Room(room_name="sc254")
    ]
    db.add_all(rooms)
    db.commit()

    # 3. Create Categories
    categories = [
        Category(category_name="Notebook"),
        Category(category_name="Projector"),
        Category(category_name="QR Scanner"),
        Category(category_name="Adapter")
    ]
    db.add_all(categories)
    db.commit()

    # 4. Create Brands
    brands = [
        Brand(brand_name="DELL"),
        Brand(brand_name="SONY"),
        Brand(brand_name="UGREEN"),
        Brand(brand_name="Logitech")
    ]
    db.add_all(brands)
    db.commit()

    # Retrieve inserted IDs
    db_rooms = db.query(Room).all()
    room_map = {r.room_name: r.room_id for r in db_rooms}
    
    db_cats = db.query(Category).all()
    cat_map = {c.category_name: c.category_id for c in db_cats}

    db_brands = db.query(Brand).all()
    brand_map = {b.brand_name: b.brand_id for b in db_brands}

    # 5. Create Assets
    assets = [
        Asset(
            assets_id="IT-DELL-01",
            assets_name="Dell Inspiron 15",
            image_url="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200",
            brand_id=brand_map["DELL"],
            QRcode="IT-DELL-01",
            room_id=room_map["sc254"],
            category_id=cat_map["Notebook"],
            status="ถูกยืม"
        ),
        Asset(
            assets_id="IT-DELL-02",
            assets_name="Dell Latitude 5420",
            image_url="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200",
            brand_id=brand_map["DELL"],
            QRcode="IT-DELL-02",
            room_id=room_map["sc251"],
            category_id=cat_map["Notebook"],
            status="ว่าง"
        ),
        Asset(
            assets_id="IT-SONY-01",
            assets_name="Sony Laser Projector",
            image_url="https://images.unsplash.com/photo-1535016120720-40c646be5580?w=200",
            brand_id=brand_map["SONY"],
            QRcode="IT-SONY-01",
            room_id=room_map["sc252"],
            category_id=cat_map["Projector"],
            status="ว่าง"
        ),
        Asset(
            assets_id="IT-UGREEN-01",
            assets_name="Ugreen USB-C Multi Hub",
            image_url="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200",
            brand_id=brand_map["UGREEN"],
            QRcode="IT-UGREEN-01",
            room_id=room_map["sc253"],
            category_id=cat_map["Adapter"],
            status="ถูกยืม"
        ),
        Asset(
            assets_id="IT-DELL-03",
            assets_name="Dell Inspiron 15 (Damaged)",
            image_url="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200",
            brand_id=brand_map["DELL"],
            QRcode="IT-DELL-03",
            room_id=room_map["sc254"],
            category_id=cat_map["Notebook"],
            status="ชำรุด"
        ),
        Asset(
            assets_id="IT-LOGI-01",
            assets_name="Logitech Wireless Presenter R400",
            image_url="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200",
            brand_id=brand_map["Logitech"],
            QRcode="IT-LOGI-01",
            room_id=room_map["sc251"],
            category_id=cat_map["QR Scanner"],
            status="ว่าง"
        ),
        Asset(
            assets_id="IT-SONY-02",
            assets_name="Sony Laser Projector",
            image_url="https://images.unsplash.com/photo-1535016120720-40c646be5580?w=200",
            brand_id=brand_map["SONY"],
            QRcode="IT-SONY-02",
            room_id=room_map["sc253"],
            category_id=cat_map["Projector"],
            status="ถูกยืม"
        ),
        Asset(
            assets_id="IT-LOGI-02",
            assets_name="Logitech MX Master 3S",
            image_url="https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200",
            brand_id=brand_map["Logitech"],
            QRcode="IT-LOGI-02",
            room_id=room_map["sc254"],
            category_id=cat_map["Adapter"],
            status="ถูกยืม"
        ),
        Asset(
            assets_id="IT-DELL-04",
            assets_name="Dell XPS 13",
            image_url="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200",
            brand_id=brand_map["DELL"],
            QRcode="IT-DELL-04",
            room_id=room_map["sc252"],
            category_id=cat_map["Notebook"],
            status="ว่าง"
        )
    ]
    db.add_all(assets)
    db.commit()

    # 6. Create Transactions (Historical & Current)
    now = datetime.utcnow()
    
    # Transaction 1: Active & Overdue (Borrowed 3 days ago, deadline was 1 day ago)
    t1 = Transaction(
        user_id="67114540088", # Chaiyot
        assets_id="IT-DELL-01",
        borrowed_at=now - timedelta(days=3),
        return_deadline=now - timedelta(days=1),
        returned_at=None,
        condition_status=None,
        proceed_type="borrow"
    )
    # Register in active MemberBorrowed
    mb1 = MemberBorrowed(
        user_id="67114540088",
        assets_id="IT-DELL-01",
        borrowed_at=now - timedelta(days=3),
        return_deadline=now - timedelta(days=1)
    )

    # Transaction 2: Active & On-Time (Borrowed today, deadline in 2 days)
    t2 = Transaction(
        user_id="67114540033", # Kaitip
        assets_id="IT-UGREEN-01",
        borrowed_at=now - timedelta(hours=4),
        return_deadline=now + timedelta(days=2),
        returned_at=None,
        condition_status=None,
        proceed_type="borrow"
    )
    # Register in active MemberBorrowed
    mb2 = MemberBorrowed(
        user_id="67114540033",
        assets_id="IT-UGREEN-01",
        borrowed_at=now - timedelta(hours=4),
        return_deadline=now + timedelta(days=2)
    )

    # Transaction 3: Historical Completed & Returned (Borrowed 5 days ago, returned 4 days ago)
    t3 = Transaction(
        user_id="67114540314", # Pannawit
        assets_id="IT-SONY-01",
        borrowed_at=now - timedelta(days=5),
        return_deadline=now - timedelta(days=3),
        returned_at=now - timedelta(days=4),
        condition_status="ปกติ",
        proceed_type="return"
    )

    # Transaction 4: Historical Completed & Returned as Damaged (Borrowed 10 days ago, returned 9 days ago)
    t4 = Transaction(
        user_id="67114540088", # Chaiyot
        assets_id="IT-DELL-03",
        borrowed_at=now - timedelta(days=10),
        return_deadline=now - timedelta(days=7),
        returned_at=now - timedelta(days=9),
        condition_status="ชำรุด",
        proceed_type="return"
    )
    
    # Transaction 5: Active & Overdue heavily (Borrowed 10 days ago, deadline was 3 days ago)
    t5 = Transaction(
        user_id="67114540199", # Kittipong
        assets_id="IT-SONY-02",
        borrowed_at=now - timedelta(days=10),
        return_deadline=now - timedelta(days=3),
        returned_at=None,
        condition_status=None,
        proceed_type="borrow"
    )
    mb3 = MemberBorrowed(
        user_id="67114540199",
        assets_id="IT-SONY-02",
        borrowed_at=now - timedelta(days=10),
        return_deadline=now - timedelta(days=3)
    )

    # Transaction 6: Active & On-Time (Borrowed today, deadline in 5 days)
    t6 = Transaction(
        user_id="67114540256", # Napat
        assets_id="IT-LOGI-02",
        borrowed_at=now - timedelta(hours=5),
        return_deadline=now + timedelta(days=5),
        returned_at=None,
        condition_status=None,
        proceed_type="borrow"
    )
    mb4 = MemberBorrowed(
        user_id="67114540256",
        assets_id="IT-LOGI-02",
        borrowed_at=now - timedelta(hours=5),
        return_deadline=now + timedelta(days=5)
    )

    # Transaction 7: Historical Completed & Returned on time (Borrowed 20 days ago, returned 14 days ago)
    t7 = Transaction(
        user_id="67114540033", # Kaitip
        assets_id="IT-DELL-02",
        borrowed_at=now - timedelta(days=20),
        return_deadline=now - timedelta(days=13),
        returned_at=now - timedelta(days=14),
        condition_status="ปกติ",
        proceed_type="return"
    )

    # 7. Create Damaged Report for IT-DELL-03
    dr1 = DamagedReport(
        assets_id="IT-DELL-03",
        user_id="67114540088",
        issue_description="หน้าจอแตก เปิดไม่ติดหลังจากใช้งานเสร็จ",
        reported_at=now - timedelta(days=9),
        repair_status="Pending"
    )

    db.add_all([t1, t2, t3, t4, t5, t6, t7, mb1, mb2, mb3, mb4, dr1])
    db.commit()
    print("[SEED] Database seeded successfully!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        seed_database(db)
    finally:
        db.close()
