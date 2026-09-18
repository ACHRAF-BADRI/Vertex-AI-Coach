from flask import Flask
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient

from app.config import Config

bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    bcrypt.init_app(app)
    jwt.init_app(app)

    mongo_client = MongoClient(app.config["MONGODB_URI"])
    app.db = mongo_client.get_default_database()

    from app.routes.activities import activities_bp
    from app.routes.auth import auth_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(activities_bp, url_prefix="/api/activities")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
