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
    from app.routes.admin import admin_bp
    from app.routes.auth import auth_bp
    from app.routes.gym import gym_bp
    from app.routes.plans import plans_bp
    from app.routes.stats import stats_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(activities_bp, url_prefix="/api/activities")
    app.register_blueprint(plans_bp, url_prefix="/api/plans")
    app.register_blueprint(stats_bp, url_prefix="/api/stats")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(gym_bp, url_prefix="/api/gym")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
