# app_filters.py
def format_number(value):
    """Format number with commas"""
    try:
        return f"{int(value):,}"
    except (ValueError, TypeError):
        return value