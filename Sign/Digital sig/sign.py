from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
import os

KEYS_DIR = "keys"

def generate_keys(student_id):
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    os.makedirs(KEYS_DIR, exist_ok=True)
    
    with open(f"{KEYS_DIR}/{student_id}_private.pem", "wb") as priv_file:
        priv_file.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))

    with open(f"{KEYS_DIR}/{student_id}_public.pem", "wb") as pub_file:
        pub_file.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))

def sign_message(student_id, message):
    """
    Sign a message using the student's private key stored in a file.

    Args:
        student_id (str): The ID of the student.
        message (bytes): The message to be signed.

    Returns:
        bytes: The digital signature.
    """
    try:
        # Load private key from file
        with open(f"{student_id}_private_key.pem", "rb") as private_file:
            private_key = serialization.load_pem_private_key(
                private_file.read(),
                password=None
            )

        # Sign the message
        signature = private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        print(f"Message signed successfully for {student_id}.")
        return signature

    except Exception as e:
        print(f"Error signing message for {student_id}: {e}")
        return None

# Example: Sign a message and save to `signature.bin`
if __name__ == "__main__":
    student_id = "Student2"  # Replace with actual student ID
    message = b"Authenticate Student2"  # Replace with actual authentication data

    # Generate digital signature
    signature = sign_message(student_id, message)

    if signature:
        # Save signature to a binary file
        with open("signature.bin", "wb") as sig_file:
            sig_file.write(signature)
        print("Signature saved to 'signature.bin'.")
