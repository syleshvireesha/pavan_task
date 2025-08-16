from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
import config

# Enable CORS for your frontend origin

CONFIG = config.CONFIG()
app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# PostgreSQL connection settings
DB_HOST = CONFIG.DB_HOST
DB_NAME = CONFIG.DB_NAME
DB_USER = CONFIG.DB_USER
DB_PASS = CONFIG.DB_PASS
GEOMETRY_DB_NAME = CONFIG.GEOMETRY_DB_NAME

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def get_db_geometry_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=GEOMETRY_DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT password, role FROM users WHERE username = %s", (username,))
    row = cur.fetchone()

    cur.close()
    conn.close()

    if row is None:
        return jsonify({"message": "Invalid username or password"}), 401

    stored_hashed_password = row[0].encode('utf-8')
    user_role = row[1]

    # Check the entered password against the stored hashed password
    if bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password):
        return jsonify({
            "message": "Login successful",
            "role": user_role
        }), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401



@app.route('/api/save-geometry', methods=['POST'])
def save_geometry():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400

    geojson_str = str(data['geometry'])  # Convert dict to string for SQL
    conn_geom = get_db_geometry_connection()
    cur = conn_geom.cursor()
    try:
        cur.execute(
            "INSERT INTO geometries (geom) VALUES (ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326)) RETURNING id",
            (geojson_str,)
        )
        new_id = cur.fetchone()[0]
        conn_geom.commit()
        return jsonify({"success": True, "id": new_id}), 200
    except Exception as e:
        conn_geom.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        cur.close()
        conn_geom.close()


if __name__ == '__main__':
    app.run(debug=True, port=8081)
