import importlib.machinery
import importlib.util
import os
import sys

sys.path.insert(0, '/home/denspark/denspark')

os.environ['DATABASE_URL'] = 'mysql://denspark_denspark_user:Brian3113Studio@localhost:3306/denspark_denspark_db'
os.environ['SECRET_KEY'] = '20d0b00321ee3d0d6c00e759cae228c53b3832a6d837e8b5488fefe225902f99'
os.environ['CLOUDINARY_CLOUD_NAME'] = 'drsxyfps4'
os.environ['CLOUDINARY_API_KEY'] = '752154612579888'
os.environ['CLOUDINARY_API_SECRET'] = 'tU3fjkIMbc7giSl7w3Sw47mSDPw'
os.environ['RESEND_API_KEY'] = 're_N7uz5RWH_Lz9kiRjTpTbTormGrhbkcmYA'
os.environ['RESEND_FROM'] = 'onboarding@resend.dev'
os.environ['ADMIN_EMAIL'] = 'densparkstudio@gmail.com'
os.environ['ALLOWED_ORIGIN'] = 'https://densparkstudio.com'

def load_source(modname, filename):
    loader = importlib.machinery.SourceFileLoader(modname, filename)
    spec = importlib.util.spec_from_file_location(modname, filename, loader=loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module

wsgi = load_source('wsgi', 'app.py')
application = wsgi.app