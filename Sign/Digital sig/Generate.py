from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from pymongo import MongoClient

# MongoDB Connection
client = MongoClient("mongodb+srv://ritwiksuneliya:Ritwik123@cluster0.4o02p.mongodb.net/attendance-system?retryWrites=true&w=majority")  # Connect to MongoDB server
db = client["attendance-system"]  # Use your database name
students_collection = db["Signature"]  # Use your collection name

def generate_and_store_keys(student_id):
    """
    Generate RSA private and public keys, save them to files, 
    and store them in MongoDB for a specific student.
    
    Args:
        student_id (str): Unique identifier for the student.
    """
    # Check if the student's keys already exist in MongoDB
    if students_collection.find_one({"student_id": student_id}):
        print(f"Keys for student '{student_id}' already exist in MongoDB.")
        return

    try:
        # Generate Private Key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,  # You can increase this to 4096 for stronger encryption
        )

        # Generate Public Key from the Private Key
        public_key = private_key.public_key()

        # Serialize Private Key to PEM Format
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()  # No password protection
        )

        # Serialize Public Key to PEM Format
        public_key_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        # Save Private Key to a File
        with open(f"{student_id}_private_key.pem", "wb") as private_file:
            private_file.write(private_key_pem)

        # Save Public Key to a File
        with open(f"{student_id}_public_key.pem", "wb") as public_file:
            public_file.write(public_key_pem)

        print(f"Keys have been successfully saved to files for {student_id}.")

        # Store Keys in MongoDB
        students_collection.insert_one({
            "student_id": student_id,
            "private_key": private_key_pem.decode('utf-8'),  # Store as a string in PEM format
            "public_key": public_key_pem.decode('utf-8')     # Store as a string in PEM format
        })

        print(f"Keys have been successfully stored in MongoDB for {student_id}.")

    except Exception as e:
        print(f"An error occurred while generating or storing keys for {student_id}: {e}")

def check_student_in_mongo(student_id):
    """
    Check if a specific student exists in MongoDB and ensure it's the only one.
    
    Args:
        student_id (str): The ID of the student to check.
    
    Returns:
        bool: True if the student exists and is unique, False otherwise.
    """
    count = students_collection.count_documents({"student_id": student_id})
    
    if count == 1:
        print(f"Student '{student_id}' exists and is unique in MongoDB.")
        return True
    elif count > 1:
        print(f"Multiple entries found for student '{student_id}' in MongoDB!")
        return False
    else:
        print(f"Student '{student_id}' does not exist in MongoDB.")
        return False

# Example: Add Student4 and check if it's unique
if __name__ == "__main__":
    new_student_id = "Samarth"

    # Generate keys for Student4 and store them in MongoDB
    generate_and_store_keys(new_student_id)

    # Verify if Student4 is unique in MongoDB
    is_unique = check_student_in_mongo(new_student_id)
