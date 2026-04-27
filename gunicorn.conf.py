# gunicorn.conf.py
bind = "0.0.0.0:8080"
workers = 1
timeout = 120
limit_request_line = 0
limit_request_field_size = 0
limit_request_fields = 100
limit_request_body = 10 * 1024 * 1024  # 10MB upload limit