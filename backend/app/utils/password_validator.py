import re
from typing import List

class PasswordValidator:
    """Password validation utility with security requirements"""
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, List[str]]:
        """
        Validate password against security requirements
        
        Returns:
            tuple: (is_valid, list_of_errors)
        """
        errors = []
        
        # Minimum length check
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        # Maximum length check (prevent DoS)
        if len(password) > 128:
            errors.append("Password must be less than 128 characters")
        
        # Uppercase letter check
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter")
        
        # Lowercase letter check
        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter")
        
        # Number check
        if not re.search(r"[0-9]", password):
            errors.append("Password must contain at least one number")
        
        # Special character check
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            errors.append("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)")
        
        # Common password check
        common_passwords = [
            "password", "123456", "password123", "admin", "qwerty",
            "abc123", "letmein", "welcome", "monkey", "dragon"
        ]
        if password.lower() in common_passwords:
            errors.append("Password is too common, please choose a stronger password")
        
        # Sequential characters check
        if re.search(r"(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)", password.lower()):
            errors.append("Password should not contain sequential characters")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def get_password_strength(password: str) -> str:
        """
        Get password strength rating
        
        Returns:
            str: "weak", "medium", "strong", or "very_strong"
        """
        score = 0
        
        # Length scoring
        if len(password) >= 8:
            score += 1
        if len(password) >= 12:
            score += 1
        if len(password) >= 16:
            score += 1
        
        # Character variety scoring
        if re.search(r"[a-z]", password):
            score += 1
        if re.search(r"[A-Z]", password):
            score += 1
        if re.search(r"[0-9]", password):
            score += 1
        if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            score += 1
        
        # No common patterns
        if not re.search(r"(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)", password.lower()):
            score += 1
        
        if score <= 3:
            return "weak"
        elif score <= 5:
            return "medium"
        elif score <= 7:
            return "strong"
        else:
            return "very_strong"
    
    @staticmethod
    def generate_password_requirements() -> str:
        """Get password requirements as a formatted string"""
        return """Password Requirements:
• At least 8 characters long
• At least one uppercase letter (A-Z)
• At least one lowercase letter (a-z)
• At least one number (0-9)
• At least one special character (!@#$%^&*(),.?\":{}|<>)
• Must not be a common password
• Must not contain sequential characters"""
