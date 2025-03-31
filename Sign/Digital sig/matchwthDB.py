from cryptography.hazmat.primitives import serialization
from pymongo import MongoClient

# MongoDB Connection
client = MongoClient("mongodb+srv://ritwiksuneliya:Ritwik123@cluster0.4o02p.mongodb.net/attendance-system?retryWrites=true&w=majority")  # Connect to MongoDB server
db = client["attendance-system"]  # Use your database name
students_collection = db["Signature"]  # Use your collection name

# Load private key from file
with open("Student1_private_key.pem", "rb") as private_file:
    private_key = serialization.load_pem_private_key(private_file.read(), password=None)

# Load public key from MongoDB
student_data = students_collection.find_one({"student_id": "Student1"})
if not student_data:
    print("Student1 not found in MongoDB.")
    exit(1)

public_key_from_mongo = serialization.load_pem_public_key(student_data["public_key"].encode('utf-8'))

# Compare keys
assert private_key.public_key().public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
) == public_key_from_mongo.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
), "Public keys do not match!"

print("Keys match successfully.")
