import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from app import create_app
from app.models import user as user_model


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/make_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1]
    app = create_app()
    with app.app_context():
        user = user_model.find_by_email(email)
        if not user:
            print(f"Aucun utilisateur avec l'email {email}")
            sys.exit(1)
        user_model.set_role(str(user["_id"]), "admin")
        print(f"{email} est maintenant admin.")


if __name__ == "__main__":
    main()
