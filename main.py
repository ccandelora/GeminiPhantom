import subprocess
from app import app, db

def build_css():
    try:
        subprocess.run(["npm", "run", "build-css"], check=True)
        print("CSS built successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error building CSS: {e}")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    build_css()
    app.run(host="0.0.0.0", port=5000)
